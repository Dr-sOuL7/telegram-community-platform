import { prisma } from "../../db/prisma";
import { telegramClient } from "../../lib/telegram/TelegramClient";
import { logger } from "../../lib/logger/pino";
import { moderationRepo, groupRepo } from "../container";
import { getSystemUserId } from "../system/SystemUser";

export class SpamService {
  /**
   * Checks if a user is sending messages too fast and punishes them if so.
   *
   * CRITICAL: runs synchronously in the dispatch path and PROPAGATES errors.
   * A DB failure here must fail the worker so QStash retries — losing a
   * moderation action silently is unacceptable for the audit trail. The only
   * swallowed failure is the terminal SPAM_DETECTED event log (analytics),
   * which is also kept LAST so a retry cannot duplicate the moderation action.
   */
  async checkVelocityAndPunish(
    internalGroupId: string,
    internalUserId: string,
    telegramGroupId: bigint,
    telegramUserId: bigint
  ): Promise<void> {
    // 1. Get Group Settings
    const group = await groupRepo.findById(internalGroupId);
    if (!group || !group.settings?.antiSpamEnabled) return;

    try {
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

      // 4. Threshold breached — resolve SYSTEM user for audit trail
      logger.warn({ internalGroupId, internalUserId, count: recentMessagesCount }, 'Spam threshold breached');

      const systemUserId = await getSystemUserId();
      const reason = `Auto-Spam Protection: Sent ${recentMessagesCount} messages in ${thresholdTime} seconds.`;

      if (action === "WARN") {
        await telegramClient.sendMessage(telegramGroupId, `⚠️ User has been warned for spamming. (Velocity check breached)`);
        await moderationRepo.createAction({
          userId: internalUserId,
          groupId: internalGroupId,
          moderatorId: systemUserId,
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
          moderatorId: systemUserId,
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
          moderatorId: systemUserId,
          actionType: "BAN",
          reason,
        });
      }

      // ─── NON-CRITICAL: spam-detection event log (analytics) ──────
      // Swallowed, and kept LAST so a worker retry cannot duplicate the
      // moderation action created above.
      try {
        await prisma.eventLog.create({
          data: {
            groupId: internalGroupId,
            userId: internalUserId,
            eventType: "SPAM_DETECTED",
            metadata: { reason, action }
          }
        });
      } catch (eventErr) {
        logger.error({ eventErr, internalGroupId, internalUserId }, 'Non-critical: failed to log SPAM_DETECTED event');
      }

    } catch (error) {
      // CRITICAL: propagate so the worker returns 500 and QStash retries.
      // Losing an auto-moderation action silently is not acceptable.
      logger.error({ error, internalGroupId, internalUserId }, 'Spam velocity check failed — failing update for retry');
      throw error;
    }
  }
}

export const spamService = new SpamService();
