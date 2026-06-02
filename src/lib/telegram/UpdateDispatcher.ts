import { TelegramUpdate } from '../../domain/types/telegram';
import { commandRegistry } from '../../services/command/registry';
import '../../services/command/commands'; // Initialize commands
import { logger } from '../logger/pino';
import { eventLogRepo, groupRepo, userRepo } from '../../services/container';
import { getQStashClient } from '../qstash';
import { env } from '../../config/env';

export class UpdateDispatcher {
  async dispatch(update: TelegramUpdate, requestId: string): Promise<void> {
    let internalGroupId: string | undefined = undefined;
    let internalUserId: string | undefined = undefined;

    // Resolve User
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

    // Resolve Group
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

    if (update.message?.new_chat_members) {
      if (isGroup && internalGroupId) {
        const group = await groupRepo.findById(internalGroupId);
        if (group?.settings?.welcomeEnabled && group.settings.welcomeMessage) {
          for (const member of update.message.new_chat_members) {
            // Replace generic tags with actual user names
            const msgText = group.settings.welcomeMessage.replace('{name}', member.first_name);
            await telegramClient.sendMessage(update.message.chat.id, msgText);
          }
        }
      }
      return;
    }

    if (update.message?.left_chat_member) {
      if (isGroup && internalGroupId) {
        const group = await groupRepo.findById(internalGroupId);
        if (group?.settings?.farewellEnabled && group.settings.farewellMessage) {
          const member = update.message.left_chat_member;
          const msgText = group.settings.farewellMessage.replace('{name}', member.first_name);
          await telegramClient.sendMessage(update.message.chat.id, msgText);
        }
      }
      return;
    }

    if (update.message && update.message.text && update.message.text.startsWith('/')) {
      const parts = update.message.text.split(' ');
      const commandName = parts[0].substring(1).split('@')[0];
      
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
          
          if (isGroup && internalGroupId && internalUserId) {
            const event = await eventLogRepo.logEvent({
              groupId: internalGroupId,
              userId: internalUserId,
              eventType: 'COMMAND_EXECUTED',
              metadata: { commandName }
            });
            
            // Dispatch to async event processor
            await getQStashClient().publishJSON({
              url: `${env.APP_URL}/api/v1/worker/process-event`,
              body: event,
            });
          }
        } catch (error) {
          logger.error({ requestId, commandName, err: error }, 'Command execution failed');
        }
      } else {
        logger.debug({ requestId, commandName }, 'Command not found in registry');
      }
    } else if (update.message) {
      if (isGroup && internalGroupId && internalUserId) {
        logger.info({ requestId }, 'Received standard message, logging to event stream...');

        const event = await eventLogRepo.logEvent({
          groupId: internalGroupId,
          userId: internalUserId,
          eventType: 'MESSAGE_SENT'
        });
        
        // Dispatch to async event processor
        await getQStashClient().publishJSON({
          url: `${env.APP_URL}/api/v1/worker/process-event`,
          body: event,
        });

        // Trigger Auto-Spam Punisher asynchronously
        const telegramGroupId = update.message.chat.id;
        const telegramUserId = update.message.from?.id;
        if (telegramGroupId && telegramUserId) {
          // Dynamic import to avoid circular dependency
          import('../../services/spam/SpamService').then(({ spamService }) => {
            spamService.checkVelocityAndPunish(internalGroupId, internalUserId, BigInt(telegramGroupId), BigInt(telegramUserId))
              .catch(err => logger.error({ err }, 'SpamService failed'));
          });
        }
      }
    }
  }
}
