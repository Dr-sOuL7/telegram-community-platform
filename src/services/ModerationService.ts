import { prisma } from '../db/prisma';
import { IModerationService } from '../domain/interfaces/IModerationService';
import { TelegramClient } from '../lib/telegram/TelegramClient';
import { User, Group, EventType, ModerationActionType } from '@prisma/client';
import { logger } from '../lib/logger/pino';

export class ModerationService implements IModerationService {
  constructor(private telegram: TelegramClient) {}

  async warn(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void> {
    await prisma.$transaction([
      prisma.moderationAction.create({
        data: { groupId: group.id, userId: targetUser.id, moderatorId: moderator.id, actionType: ModerationActionType.WARN, reason }
      }),
      prisma.eventLog.create({
        data: { groupId: group.id, userId: targetUser.id, eventType: EventType.WARNING_CREATED, metadata: { reason } }
      }),
      prisma.user.update({
        where: { id: targetUser.id },
        data: { warnings: { increment: 1 } }
      })
    ]);

    await this.telegram.sendMessage(group.telegramGroupId, `⚠️ User has been warned. Reason: ${reason || 'None provided.'}`);
    logger.info({ groupId: group.id, targetUserId: targetUser.id }, 'User warned');
  }

  async unwarn(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void> {
    await prisma.$transaction([
      prisma.moderationAction.create({
        data: { groupId: group.id, userId: targetUser.id, moderatorId: moderator.id, actionType: ModerationActionType.UNWARN, reason }
      }),
      prisma.eventLog.create({
        data: { groupId: group.id, userId: targetUser.id, eventType: EventType.WARNING_REMOVED, metadata: { reason } }
      }),
      prisma.user.update({
        where: { id: targetUser.id },
        data: { warnings: { decrement: 1 } }
      })
    ]);
    logger.info({ groupId: group.id, targetUserId: targetUser.id }, 'User unwarned');
  }

  async mute(group: Group, targetUser: User, moderator: User, durationSeconds: number, reason?: string): Promise<void> {
    const untilDate = Math.floor(Date.now() / 1000) + durationSeconds;
    
    // Telegram API requires disabling permissions to mute
    const permissions = { can_send_messages: false };

    // Transaction
    await prisma.$transaction([
      prisma.moderationAction.create({
        data: { groupId: group.id, userId: targetUser.id, moderatorId: moderator.id, actionType: ModerationActionType.MUTE, reason }
      }),
      prisma.eventLog.create({
        data: { groupId: group.id, userId: targetUser.id, eventType: EventType.MUTE_APPLIED, metadata: { reason, durationSeconds } }
      })
    ]);

    await this.telegram.restrictChatMember(group.telegramGroupId, targetUser.telegramId, permissions, untilDate);
    logger.info({ groupId: group.id, targetUserId: targetUser.id }, 'User muted');
  }

  async unmute(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void> {
    const permissions = { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true, can_change_info: true, can_invite_users: true, can_pin_messages: true, can_manage_topics: true };
    
    await prisma.$transaction([
      prisma.moderationAction.create({
        data: { groupId: group.id, userId: targetUser.id, moderatorId: moderator.id, actionType: ModerationActionType.UNMUTE, reason }
      }),
      prisma.eventLog.create({
        data: { groupId: group.id, userId: targetUser.id, eventType: EventType.MUTE_REMOVED, metadata: { reason } }
      })
    ]);

    await this.telegram.restrictChatMember(group.telegramGroupId, targetUser.telegramId, permissions);
    logger.info({ groupId: group.id, targetUserId: targetUser.id }, 'User unmuted');
  }

  async ban(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void> {
    await prisma.$transaction([
      prisma.moderationAction.create({
        data: { groupId: group.id, userId: targetUser.id, moderatorId: moderator.id, actionType: ModerationActionType.BAN, reason }
      }),
      prisma.eventLog.create({
        data: { groupId: group.id, userId: targetUser.id, eventType: EventType.BAN_APPLIED, metadata: { reason } }
      })
    ]);

    await this.telegram.banChatMember(group.telegramGroupId, targetUser.telegramId);
    logger.info({ groupId: group.id, targetUserId: targetUser.id }, 'User banned');
  }

  async unban(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void> {
    await prisma.$transaction([
      prisma.moderationAction.create({
        data: { groupId: group.id, userId: targetUser.id, moderatorId: moderator.id, actionType: ModerationActionType.UNBAN, reason }
      }),
      prisma.eventLog.create({
        data: { groupId: group.id, userId: targetUser.id, eventType: EventType.BAN_REMOVED, metadata: { reason } }
      })
    ]);

    await this.telegram.unbanChatMember(group.telegramGroupId, targetUser.telegramId);
    logger.info({ groupId: group.id, targetUserId: targetUser.id }, 'User unbanned');
  }
}
