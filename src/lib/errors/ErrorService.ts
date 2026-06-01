import { logger } from '../logger/pino';

export enum ErrorCategory {
  TELEGRAM_API = 'TELEGRAM_API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  constructor(
    public category: ErrorCategory,
    public message: string,
    public metadata?: Record<string, any>,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ErrorService {
  static handle(error: unknown, correlationId?: string, additionalContext?: Record<string, any>) {
    const context = {
      requestId: correlationId,
      ...additionalContext,
    };

    if (error instanceof AppError) {
      logger.error({ err: error.cause || error, category: error.category, context }, error.message);
      return;
    }

    if (error instanceof Error) {
      logger.error({ err: error, category: ErrorCategory.INTERNAL, context }, error.message);
      return;
    }

    logger.error({ err: error, category: ErrorCategory.INTERNAL, context }, 'An unknown error occurred');
  }
}
