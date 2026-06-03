import { TelegramUpdate } from '../../domain/types/telegram';
import { commandRegistry } from '../../services/command/registry';
import '../../services/command/commands'; // Initialize commands
import { logger } from '../logger/pino';
import { eventLogRepo, groupRepo, userRepo } from '../../services/container';
import { getQStashClient } from '../qstash';
import { env } from '../../config/env';
import { telegramClient } from './TelegramClient';
import { spamService } from '../../services/spam/SpamService';

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
        logger.error({ err, telegramId: update.message.from.id }, 'Failed to upsert user');
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
        logger.error({ err, telegramGroupId: update.message.chat.id }, 'Failed to upsert group');
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
        // Spam detection is critical — it's a moderation action
        const telegramGroupId = update.message.chat.id;
        const telegramUserId = update.message.from?.id;
        if (telegramGroupId && telegramUserId) {
          try {
            await spamService.checkVelocityAndPunish(
              internalGroupId, internalUserId,
              BigInt(telegramGroupId), BigInt(telegramUserId)
            );
          } catch (err) {
            logger.error({ err, requestId }, 'SpamService check failed');
          }
        }

        // ─── NON-CRITICAL: Log message event (fire-and-forget) ────
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
