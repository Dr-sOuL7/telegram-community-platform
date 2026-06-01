import { User, Group } from '@prisma/client';

export interface IModerationService {
  warn(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void>;
  unwarn(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void>;
  mute(group: Group, targetUser: User, moderator: User, durationSeconds: number, reason?: string): Promise<void>;
  unmute(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void>;
  ban(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void>;
  unban(group: Group, targetUser: User, moderator: User, reason?: string): Promise<void>;
}
