import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { RateLimiter } from './RateLimiter';
import { ErrorService, ErrorCategory, AppError } from '../errors/ErrorService';

export class TelegramClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${env.BOT_TOKEN}`,
      timeout: 10000,
    });
    this.rateLimiter = new RateLimiter();
  }

  private async request<T>(endpoint: string, payload: Record<string, any> = {}): Promise<T> {
    return this.rateLimiter.enqueue(async () => {
      try {
        const response = await this.client.post(`/${endpoint}`, payload);
        if (!response.data.ok) {
          throw new AppError(ErrorCategory.TELEGRAM_API, `Telegram API Error: ${response.data.description}`, { endpoint, payload });
        }
        return response.data.result;
      } catch (error: any) {
        ErrorService.handle(error, undefined, { endpoint, payload });
        throw error;
      }
    });
  }

  async sendMessage(chatId: bigint | number | string, text: string, options?: any) {
    return this.request('sendMessage', {
      chat_id: chatId.toString(),
      text,
      ...options,
    });
  }

  async deleteMessage(chatId: bigint | number | string, messageId: number) {
    return this.request('deleteMessage', {
      chat_id: chatId.toString(),
      message_id: messageId,
    });
  }

  async banChatMember(chatId: bigint | number | string, userId: bigint | number | string) {
    return this.request('banChatMember', {
      chat_id: chatId.toString(),
      user_id: userId.toString(),
    });
  }

  async unbanChatMember(chatId: bigint | number | string, userId: bigint | number | string, onlyIfBanned = true) {
    return this.request('unbanChatMember', {
      chat_id: chatId.toString(),
      user_id: userId.toString(),
      only_if_banned: onlyIfBanned,
    });
  }

  async restrictChatMember(chatId: bigint | number | string, userId: bigint | number | string, permissions: any, untilDate?: number) {
    return this.request('restrictChatMember', {
      chat_id: chatId.toString(),
      user_id: userId.toString(),
      permissions,
      until_date: untilDate,
    });
  }

  async getChatMember(chatId: bigint | number | string, userId: bigint | number | string) {
    return this.request<any>('getChatMember', {
      chat_id: chatId.toString(),
      user_id: userId.toString(),
    });
  }
}

export const telegramClient = new TelegramClient();
