import { prisma } from "../../db/prisma";
import { telegramClient } from "../../lib/telegram/TelegramClient";
import { logger } from "../../lib/logger/pino";
import { moderationRepo } from "../container";
import { groupRepo } from "../container";

export class SpamService {
  /**
   * Checks if a user is sending messages too fast and punishes them if so.
   * Runs asynchronously in the background.
   */
  async checkVelocityAndPunish(internalGroupId: string, internalUserId: string, telegramGroupId: bigint, telegramUserId: bigint): Promise<void> {
    try {
      // 1. Get Group Settings
      const group = await groupRepo.findById(internalGroupId);
      if (!group || !group.settings?.antiSpamEnabled) return;

      const settings = group.settings;
      const thresholdMsg = settings.spamThresholdMsg || 5;
      const thresholdTime = settings.spamThresholdTime || 10; // seconds
      const action = settings.spamAction || "WARN"; // WARN, MUTE, BAN

      // 2. Query recent messages for this user in this group
      const timeWindow = new Date(Date.now() - thresholdTime * 1000);
      
      const recentMessagesCount = await prisma.message.count({
        where: {
          groupId: internalGroupId,
          userId: internalUserId,
          createdAt: { gte: timeWindow }
        }
      });

      // 3. If below threshold, all good
      if (recentMessagesCount < thresholdMsg) return;

      // 4. Threshold breached, execute spam punishment
      logger.warn({ internalGroupId, internalUserId, count: recentMessagesCount }, 'Spam threshold breached!');

      const reason = `Auto-Spam Protection: Sent ${recentMessagesCount} messages in ${thresholdTime} seconds.`;

      if (action === "WARN") {
        await telegramClient.sendMessage(telegramGroupId, `⚠️ User has been warned for spamming. (Velocity check breached)`);
        await moderationRepo.createAction({
          userId: internalUserId,
          groupId: internalGroupId,
          moderatorId: internalUserId, // System action, user is their own moderator for logs here or we use a system user
          actionType: "WARN",
          reason,
        });
      } 
      else if (action === "MUTE") {
        const untilDate = Math.floor(Date.now() / 1000) + 3600; // 1 hour mute
        await telegramClient.restrictChatMember(telegramGroupId, telegramUserId, { can_send_messages: false }, untilDate);
        await telegramClient.sendMessage(telegramGroupId, `🔇 User has been automatically muted for 1 hour for spamming.`);
        await moderationRepo.createAction({
          userId: internalUserId,
          groupId: internalGroupId,
          moderatorId: internalUserId,
          actionType: "MUTE",
          reason,
        });
      }
      else if (action === "BAN") {
        await telegramClient.banChatMember(telegramGroupId, telegramUserId);
        await telegramClient.sendMessage(telegramGroupId, `🔨 User has been automatically banned for severe spamming.`);
        await moderationRepo.createAction({
          userId: internalUserId,
          groupId: internalGroupId,
          moderatorId: internalUserId,
          actionType: "BAN",
          reason,
        });
      }

      // Log the event
      await prisma.eventLog.create({
        data: {
          groupId: internalGroupId,
          userId: internalUserId,
          eventType: "SPAM_DETECTED",
          metadata: { reason, action }
        }
      });

    } catch (error) {
      logger.error({ error, internalGroupId, internalUserId }, 'Failed to check spam velocity');
    }
  }
}

export const spamService = new SpamService();
