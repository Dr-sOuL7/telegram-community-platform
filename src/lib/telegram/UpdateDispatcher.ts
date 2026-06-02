import { TelegramUpdate } from '../../domain/types/telegram';
import { commandRegistry } from '../../services/command/registry';
import '../../services/command/commands'; // Initialize commands
import { logger } from '../logger/pino';
import { eventLogRepo } from '../../services/container';
import { getQStashClient } from '../qstash';
import { env } from '../../config/env';

export class UpdateDispatcher {
  async dispatch(update: TelegramUpdate, requestId: string): Promise<void> {
    if (update.message && update.message.text && update.message.text.startsWith('/')) {
      const parts = update.message.text.split(' ');
      const commandName = parts[0].substring(1).split('@')[0];
      
      const command = commandRegistry.get(commandName);
      if (command) {
        logger.info({ requestId, commandName }, 'Executing command');
        try {
          await command.execute({ message: update.message, requestId });
          
          // Only log analytics events for group/supergroup chats, not private DMs
          const chatType = update.message.chat.type;
          const isGroup = chatType === 'group' || chatType === 'supergroup';

          if (isGroup && update.message.chat.id && update.message.from?.id) {
            const event = await eventLogRepo.logEvent({
              groupId: update.message.chat.id.toString(),
              userId: update.message.from.id.toString(),
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
      // Only track non-command messages in groups, ignore private DMs
      const chatType = update.message.chat.type;
      const isGroup = chatType === 'group' || chatType === 'supergroup';

      if (isGroup && update.message.chat.id && update.message.from?.id) {
        logger.info({ requestId }, 'Received standard message, logging to event stream...');

        const event = await eventLogRepo.logEvent({
          groupId: update.message.chat.id.toString(),
          userId: update.message.from.id.toString(),
          eventType: 'MESSAGE_SENT'
        });
        
        // Dispatch to async event processor
        await getQStashClient().publishJSON({
          url: `${env.APP_URL}/api/v1/worker/process-event`,
          body: event,
        });
      }
    }
  }
}
