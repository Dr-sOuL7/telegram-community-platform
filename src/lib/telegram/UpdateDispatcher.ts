import { TelegramUpdate } from '../../domain/types/telegram';
import { commandRegistry } from '../../services/command/registry';
import '../../services/command/commands'; // Initialize commands
import { logger } from '../logger/pino';
import { eventLogRepo } from '../../services/container';
import { qstashClient } from '../qstash';
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
          
          // Log command execution event
          if (update.message.chat.id && update.message.from?.id) {
            const event = await eventLogRepo.logEvent({
              groupId: update.message.chat.id.toString(),
              userId: update.message.from.id.toString(),
              eventType: 'COMMAND_EXECUTED',
              metadata: { commandName }
            });
            
            // Dispatch to async event processor
            await qstashClient.publishJSON({
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
      logger.info({ requestId }, 'Received standard message, logging to event stream...');
      
      if (update.message.chat.id && update.message.from?.id) {
        const event = await eventLogRepo.logEvent({
          groupId: update.message.chat.id.toString(),
          userId: update.message.from.id.toString(),
          eventType: 'MESSAGE_SENT'
        });
        
        // Dispatch to async event processor
        await qstashClient.publishJSON({
          url: `${env.APP_URL}/api/v1/worker/process-event`,
          body: event,
        });
      }
    }
  }
}
