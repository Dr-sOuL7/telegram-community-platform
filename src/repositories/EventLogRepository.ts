import { prisma } from '../db/prisma';
import { EventLog, EventType } from '@prisma/client';

export class EventLogRepository {
  async logEvent(data: {
    groupId?: string;
    userId?: string;
    eventType: EventType;
    metadata?: Record<string, any>;
  }): Promise<EventLog> {
    return prisma.eventLog.create({
      data: {
        groupId: data.groupId,
        userId: data.userId,
        eventType: data.eventType,
        metadata: data.metadata || {},
      },
    });
  }
}
