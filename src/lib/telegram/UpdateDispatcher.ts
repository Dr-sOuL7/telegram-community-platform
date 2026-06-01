import { TelegramUpdate } from '../../domain/types/telegram';
import { commandRegistry } from '../../services/command/registry';
import { logger } from '../logger/pino';

export class UpdateDispatcher {
  async dispatch(update: TelegramUpdate, requestId: string): Promise<void> {
    if (update.message && update.message.text && update.message.text.startsWith('/')) {
      const parts = update.message.text.split(' ');
      // Handle mentions in commands (e.g., /warn@bot_username)
      const commandName = parts[0].substring(1).split('@')[0];
      
      const command = commandRegistry.get(commandName);
      if (command) {
        logger.info({ requestId, commandName }, 'Executing command');
        try {
          await command.execute({ message: update.message, requestId });
        } catch (error) {
          logger.error({ requestId, commandName, err: error }, 'Command execution failed');
        }
      } else {
        logger.debug({ requestId, commandName }, 'Command not found in registry');
      }
    } else if (update.message) {
      logger.info({ requestId }, 'Received standard message, logging to MessageRepository...');
      // Handle standard message logging
    }
  }
}
