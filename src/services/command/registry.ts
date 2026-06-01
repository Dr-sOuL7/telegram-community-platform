import { TelegramMessage } from '../../domain/types/telegram';

export interface CommandContext {
  message: TelegramMessage;
  requestId: string;
}

export interface Command {
  name: string;
  description: string;
  category: 'Moderation' | 'User' | 'Utility';
  adminOnly: boolean;
  usage: string;
  execute: (ctx: CommandContext) => Promise<void>;
}

export const commandRegistry = new Map<string, Command>();

export function registerCommand(command: Command) {
  commandRegistry.set(command.name, command);
}
