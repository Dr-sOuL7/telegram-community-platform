import { TelegramUpdate } from '../../domain/types/telegram';
import { commandRegistry } from '../../services/command/registry';
import '../../services/command/commands'; // Initialize commands
import { logger } from '../logger/pino';
import { eventLogRepo, groupRepo, userRepo } from '../../services/container';
import { getQStashClient } from '../qstash';
import { env } from '../../config/env';
import { telegramClient } from './TelegramClient';
import { spamService } from '../../services/spam/SpamService';
import { prisma } from '../../db/prisma';

export class UpdateDispatcher {
  async dispatch(update: TelegramUpdate, requestId: string): Promise<void> {
    let internalGroupId: string | undefined = undefined;
    let internalUserId: string | undefined = undefined;

    // ─── CRITICAL PATH: User & Group Resolution ──────────────────
    // These upserts are critical because they produce the internal IDs
    // needed by command execution and permission checks.

    if (update.message?.from) {
      try {
        const user = await userRepo.upsert(
          BigInt(update.message.from.id),
          {
            firstName: update.message.from.first_name,
            username: update.message.from.username
          }
        );
        internalUserId = user.id;
      } catch (err) {
        // CRITICAL: every downstream step depends on internalUserId. Rethrow so
        // the worker returns 500 and QStash retries (upsert is idempotent).
        logger.error({ err, telegramId: update.message.from.id }, 'CRITICAL: Failed to upsert user — failing update for retry');
        throw err;
      }
    }

    const chatType = update.message?.chat?.type;
    const isGroup = chatType === 'group' || chatType === 'supergroup';

    if (isGroup && update.message?.chat) {
      try {
        const group = await groupRepo.upsert(
          BigInt(update.message.chat.id),
          update.message.chat.title || 'Unknown Group'
        );
        internalGroupId = group.id;
      } catch (err) {
        // CRITICAL: group resolution gates moderation/persistence. Rethrow for retry.
        logger.error({ err, telegramGroupId: update.message.chat.id }, 'CRITICAL: Failed to upsert group — failing update for retry');
        throw err;
      }
    }

    // ─── CRITICAL PATH: Welcome / Farewell Messages ──────────────

    if (update.message?.new_chat_members) {
      if (isGroup && internalGroupId) {
        try {
          const group = await groupRepo.findById(internalGroupId);
          if (group?.settings?.welcomeEnabled && group.settings.welcomeMessage) {
            for (const member of update.message.new_chat_members) {
              const msgText = group.settings.welcomeMessage.replace('{name}', member.first_name);
              await telegramClient.sendMessage(update.message.chat.id, msgText);
            }
          }
        } catch (err) {
          logger.error({ err, internalGroupId }, 'Failed to send welcome message');
        }
      }
      return;
    }

    if (update.message?.left_chat_member) {
      if (isGroup && internalGroupId) {
        try {
          const group = await groupRepo.findById(internalGroupId);
          if (group?.settings?.farewellEnabled && group.settings.farewellMessage) {
            const member = update.message.left_chat_member;
            const msgText = group.settings.farewellMessage.replace('{name}', member.first_name);
            await telegramClient.sendMessage(update.message.chat.id, msgText);
          }
        } catch (err) {
          logger.error({ err, internalGroupId }, 'Failed to send farewell message');
        }
      }
      return;
    }

    // ─── CRITICAL PATH: Command Execution ────────────────────────

    if (update.message && update.message.text && update.message.text.startsWith('/')) {
      const parts = update.message.text.split(/\s+/);
      const commandName = parts[0].substring(1).split('@')[0].toLowerCase();
      
      const command = commandRegistry.get(commandName);
      if (command) {
        logger.info({ requestId, commandName }, 'Executing command');
        try {
          await command.execute({ 
            message: update.message, 
            requestId, 
            internalGroupId, 
            internalUserId 
          });
        } catch (error) {
          logger.error({ requestId, commandName, err: error }, 'Command execution failed');
        }

        // ─── NON-CRITICAL: Log command event (fire-and-forget) ────
        if (isGroup && internalGroupId && internalUserId) {
          this.deferEventLog(internalGroupId, internalUserId, 'COMMAND_EXECUTED', { commandName })
            .catch(err => logger.error({ err, requestId }, 'Non-critical: failed to log command event'));
        }
      } else {
        logger.debug({ requestId, commandName }, 'Command not found in registry');
      }
      return;
    }

    // ─── CRITICAL PATH: Standard Message — Spam Detection ────────

    if (update.message) {
      if (isGroup && internalGroupId && internalUserId) {
        const telegramGroupId = update.message.chat.id;
        const telegramUserId = update.message.from?.id;

        // ─── CRITICAL: Persist message FIRST ─────────────────────────
        // Durable + queryable later (AI summarization) and counted by the spam
        // velocity check below. Persisting before the spam check means the
        // triggering message is included in its own velocity window. Idempotent
        // on (groupId, messageId): a QStash retry must not create a duplicate
        // row (a duplicate would also inflate the velocity count → false ban).
        if (update.message.text && !update.message.text.startsWith('/')) {
          try {
            await prisma.message.create({
              data: {
                groupId: internalGroupId,
                userId: internalUserId,
                messageId: BigInt(update.message.message_id),
                messageText: update.message.text,
              },
            });
          } catch (err) {
            // P2002 = already persisted by a prior delivery → treat as success.
            // (Inert until the @@unique([groupId, messageId]) constraint is
            // applied via `prisma db push`; until then no P2002 is raised.)
            const code = (err as { code?: string } | null)?.code;
            if (code !== 'P2002') {
              logger.error({ err, requestId }, 'CRITICAL: Failed to persist message — failing update for retry');
              throw err;
            }
          }
        }

        // ─── CRITICAL: Spam detection / moderation ───────────────────
        // Propagates DB failures so the moderation audit trail is never
        // silently lost; the worker retries on failure.
        if (telegramGroupId && telegramUserId) {
          await spamService.checkVelocityAndPunish(
            internalGroupId, internalUserId,
            BigInt(telegramGroupId), BigInt(telegramUserId)
          );
        }

        // ─── NON-CRITICAL: analytics event (fire-and-forget) ─────────
        this.deferEventLog(internalGroupId, internalUserId, 'MESSAGE_SENT')
          .catch(err => logger.error({ err, requestId }, 'Non-critical: failed to log message event'));
      }
    }
  }

  /**
   * Fire-and-forget: logs an event to the database, then publishes it
   * to the QStash analytics worker. Errors here must never block the
   * critical path.
   */
  private async deferEventLog(
    groupId: string,
    userId: string,
    eventType: 'COMMAND_EXECUTED' | 'MESSAGE_SENT',
    metadata?: Record<string, any>
  ): Promise<void> {
    const event = await eventLogRepo.logEvent({ groupId, userId, eventType, metadata });
    await getQStashClient().publishJSON({
      url: `${env.APP_URL}/api/v1/worker/process-event`,
      body: event,
    });
  }
}
