import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});
