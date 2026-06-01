import { ReputationRepository } from '../repositories/ReputationRepository';
import { ErrorService, ErrorCategory, AppError } from '../errors/ErrorService';
import { logger } from '../logger/pino';

export class ReputationService {
  public static readonly RULES = {
    HELPFUL_MESSAGE: 2,
    WARNING: -10,
    MUTE: -20,
    BAN: -50,
    SPAM: -30,
    SYSTEM_BONUS: 5,
  };

  constructor(private reputationRepo: ReputationRepository) {}

  /**
   * Computes reputation level string based on score
   */
  private computeLevel(score: number): string {
    if (score < 0) return 'Suspicious';
    if (score < 10) return 'Newcomer';
    if (score < 50) return 'Member';
    if (score < 150) return 'Contributor';
    if (score < 500) return 'Veteran';
    return 'Elite';
  }

  async applyChange(userId: string, groupId: string, delta: number, reason: string, sourceType: string): Promise<void> {
    if (delta === 0) return;
    
    try {
      // Record history
      await this.reputationRepo.addHistory({
        userId,
        groupId,
        delta,
        reason,
        sourceType
      });

      // Update User and recompute level
      // We need the current score to properly compute the new level, but since Prisma's increment
      // doesn't return the new value before update easily in a transaction without a read,
      // we can let the DB increment it, then read, or we can just fetch first.
      
      const user = await this.reputationRepo.updateUserReputation(userId, delta, null);
      const newLevel = this.computeLevel(user.reputation);
      
      if (user.reputationLevel !== newLevel) {
        await this.reputationRepo.updateUserReputation(userId, 0, newLevel);
        logger.info({ userId, groupId, newLevel }, 'User reputation level changed');
      }
      
    } catch (error) {
      ErrorService.handleError(error, { userId, groupId, delta });
      throw new AppError('Failed to apply reputation change', ErrorCategory.DATABASE);
    }
  }

  async getLeaderboard(groupId: string, limit: number = 10) {
    return this.reputationRepo.getTopUsers(groupId, limit);
  }
}
