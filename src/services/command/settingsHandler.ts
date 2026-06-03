import { CommandContext } from './registry';
import { telegramClient } from '../../lib/telegram/TelegramClient';
import { prisma } from '../../db/prisma';
import { logger } from '../../lib/logger/pino';
import { TelegramCallbackQuery, TelegramMessage } from '../../domain/types/telegram';

async function isUserAdmin(chatId: string | bigint | number, userId: string | bigint | number): Promise<boolean> {
  try {
    const member = await telegramClient.getChatMember(chatId, userId);
    return member.status === 'creator' || member.status === 'administrator';
  } catch {
    return false;
  }
}

function parseSmartTime(input: string): number | null {
  let totalSeconds = 0;
  let matched = false;
  
  const hoursMatch = input.match(/(\d+)\s*h/i);
  if (hoursMatch) { totalSeconds += parseInt(hoursMatch[1]) * 3600; matched = true; }
  
  const minsMatch = input.match(/(\d+)\s*m/i);
  if (minsMatch) { totalSeconds += parseInt(minsMatch[1]) * 60; matched = true; }
  
  const secsMatch = input.match(/(\d+)\s*s/i);
  if (secsMatch) { totalSeconds += parseInt(secsMatch[1]); matched = true; }
  
  if (!matched) {
    const num = parseInt(input);
    if (!isNaN(num)) return num;
    return null;
  }
  
  return totalSeconds;
}

function buildSettingsMenu(settings: any, groupId: string) {
  const keyboard = [
    [
      { text: `Anti-Spam: ${settings.antiSpamEnabled ? '✅ ON' : '❌ OFF'}`, callback_data: `set_toggleSpam_${groupId}` }
    ],
    [
      { text: `Edit Spam Threshold (${settings.spamThresholdMsg}m/${settings.spamThresholdTime}s)`, callback_data: `set_spamThreshMenu_${groupId}` },
      { text: `Spam Action: ${settings.spamAction}`, callback_data: `set_spamAct_${groupId}` }
    ],
    [
      { text: `Edit Warn Limit (${settings.warnThreshold})`, callback_data: `set_warnLimit_${groupId}` },
      { text: `Edit Mute Limit (${settings.muteThreshold})`, callback_data: `set_muteLimit_${groupId}` }
    ],
    [
      { text: `Welcome: ${settings.welcomeEnabled ? '✅ ON' : '❌ OFF'}`, callback_data: `set_toggleWelc_${groupId}` },
      { text: `Edit Welcome Msg`, callback_data: `set_editWelc_${groupId}` }
    ],
    [
      { text: `Farewell: ${settings.farewellEnabled ? '✅ ON' : '❌ OFF'}`, callback_data: `set_toggleFare_${groupId}` },
      { text: `Edit Farewell Msg`, callback_data: `set_editFare_${groupId}` }
    ]
  ];
  return { inline_keyboard: keyboard };
}

export async function handleSettingsDeepLink(ctx: CommandContext, groupId: string) {
  const { message } = ctx;
  if (!message.from || message.chat.type !== 'private') return;

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      await telegramClient.sendMessage(message.chat.id, "❌ Group not found.");
      return;
    }

    const isAdmin = await isUserAdmin(group.telegramGroupId, message.from.id);
    if (!isAdmin) {
      await telegramClient.sendMessage(message.chat.id, "❌ You must be an admin of the group to change settings.");
      return;
    }

    let settings = await prisma.groupSettings.findUnique({ where: { groupId } });
    if (!settings) {
      settings = await prisma.groupSettings.create({ data: { groupId } });
    }

    const text = `⚙️ **Settings for ${group.groupName}**\n\nUse the buttons below to toggle features. To edit values, follow the bot's prompt.`;
    const markup = buildSettingsMenu(settings, groupId);

    await telegramClient.sendMessage(message.chat.id, text, { parse_mode: 'Markdown', reply_markup: markup });
  } catch (err: any) {
    logger.error({ err, groupId }, 'Failed to handle settings deep link');
    await telegramClient.sendMessage(message.chat.id, "❌ Failed to load settings.");
  }
}

export async function handleSettingsCallback(query: TelegramCallbackQuery) {
  if (!query.data || !query.data.startsWith('set_')) return;
  
  const parts = query.data.split('_');
  if (parts.length < 3) return;
  
  const action = parts[1];
  const groupId = parts[2];
  
  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return;

    const isAdmin = await isUserAdmin(group.telegramGroupId, query.from.id);
    if (!isAdmin) {
      await telegramClient.answerCallbackQuery(query.id, { text: "❌ Not an admin.", show_alert: true });
      return;
    }

    let settings = await prisma.groupSettings.findUnique({ where: { groupId } });
    if (!settings) return;

    let updated = false;

    if (action === 'mainMenu') {
      if (query.message) {
        const markup = buildSettingsMenu(settings, groupId);
        await telegramClient.editMessageText(query.from.id, query.message.message_id, `⚙️ **Settings for ${group.groupName}**\n\nUse the buttons below to toggle features. To edit values, follow the bot's prompt.`, { parse_mode: 'Markdown', reply_markup: markup });
      }
      await telegramClient.answerCallbackQuery(query.id);
      return;
    } else if (action === 'spamThreshMenu') {
      const markup = {
        inline_keyboard: [
          [{ text: "📝 Number of Messages", callback_data: `set_spamMsg_${groupId}` }],
          [{ text: "⏱️ Time Window", callback_data: `set_spamTime_${groupId}` }],
          [{ text: "« Back to Settings", callback_data: `set_mainMenu_${groupId}` }]
        ]
      };
      if (query.message) {
        await telegramClient.editMessageText(query.from.id, query.message.message_id, `⚙️ **Spam Threshold Settings**\n\nCurrent: ${settings.spamThresholdMsg} messages / ${settings.spamThresholdTime} seconds`, { parse_mode: 'Markdown', reply_markup: markup });
      }
      await telegramClient.answerCallbackQuery(query.id);
      return;
    } else if (action === 'toggleSpam') {
      settings = await prisma.groupSettings.update({ where: { groupId }, data: { antiSpamEnabled: !settings.antiSpamEnabled } });
      updated = true;
    } else if (action === 'toggleWelc') {
      settings = await prisma.groupSettings.update({ where: { groupId }, data: { welcomeEnabled: !settings.welcomeEnabled } });
      updated = true;
    } else if (action === 'toggleFare') {
      settings = await prisma.groupSettings.update({ where: { groupId }, data: { farewellEnabled: !settings.farewellEnabled } });
      updated = true;
    } else if (action === 'spamAct') {
      const nextAction = settings.spamAction === 'WARN' ? 'MUTE' : (settings.spamAction === 'MUTE' ? 'BAN' : 'WARN');
      settings = await prisma.groupSettings.update({ where: { groupId }, data: { spamAction: nextAction } });
      updated = true;
    } else if (['spamMsg', 'spamTime', 'warnLimit', 'muteLimit', 'editWelc', 'editFare'].includes(action)) {
      
      // Store session in database
      await prisma.adminSession.upsert({
        where: { userId: query.from.id.toString() },
        update: { groupId, action },
        create: { userId: query.from.id.toString(), groupId, action }
      });

      let prompt = '';
      if (action === 'spamMsg') prompt = `Please reply to this message with the Number of Messages for the spam threshold (e.g. 5).`;
      if (action === 'spamTime') prompt = `Please reply to this message with the Time Window for the spam threshold.\n\nSmart formats accepted: 1h 30m 10s, 5m, or simply 10 (for seconds).`;
      if (action === 'warnLimit') prompt = `Please reply to this message with the new Warn Limit (number).`;
      if (action === 'muteLimit') prompt = `Please reply to this message with the new Mute Limit (number).`;
      if (action === 'editWelc') prompt = `Please reply to this message with the new Welcome Message.\n\nUse {name} to insert the user's name.`;
      if (action === 'editFare') prompt = `Please reply to this message with the new Farewell Message.\n\nUse {name} to insert the user's name.`;

      await telegramClient.sendMessage(query.from.id, prompt, { reply_markup: { force_reply: true } });
      await telegramClient.answerCallbackQuery(query.id);
      return;
    }

    if (updated) {
      if (query.message) {
        const markup = buildSettingsMenu(settings, groupId);
        await telegramClient.editMessageText(query.from.id, query.message.message_id, `⚙️ **Settings for ${group.groupName}**\n\nUse the buttons below to toggle features. To edit values, follow the bot's prompt.`, { parse_mode: 'Markdown', reply_markup: markup });
      }
      await telegramClient.answerCallbackQuery(query.id);
    }
  } catch (err: any) {
    logger.error({ err, groupId: parts[2] }, 'Failed to handle settings callback');
    await telegramClient.answerCallbackQuery(query.id, { text: "❌ Error updating settings.", show_alert: true });
  }
}

export async function handleSettingsForceReply(message: TelegramMessage) {
  if (!message.reply_to_message || !message.text || !message.from) return false;

  const userId = message.from.id.toString();

  try {
    const session = await prisma.adminSession.findUnique({ where: { userId } });
    if (!session) return false; // Not editing anything or not a valid reply

    // We found a session, so we handle it
    const { groupId, action } = session;
    const value = message.text.trim();

    // Clean up session immediately to prevent stuck states
    await prisma.adminSession.delete({ where: { userId } });

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return true; // Handled, but group is gone

    const isAdmin = await isUserAdmin(group.telegramGroupId, message.from.id);
    if (!isAdmin) return true; // Handled, but no longer admin

    const updateData: any = {};

    if (action === 'spamMsg') {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        await telegramClient.sendMessage(message.chat.id, "❌ Invalid number of messages.");
        return true;
      }
      updateData.spamThresholdMsg = num;
    } else if (action === 'spamTime') {
      const seconds = parseSmartTime(value);
      if (seconds === null || seconds < 1) {
        await telegramClient.sendMessage(message.chat.id, "❌ Invalid time format. Please use something like '5m' or '1h 30m'.");
        return true;
      }
      updateData.spamThresholdTime = seconds;
    } else if (action === 'warnLimit') {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        await telegramClient.sendMessage(message.chat.id, "❌ Invalid limit.");
        return true;
      }
      updateData.warnThreshold = num;
    } else if (action === 'muteLimit') {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        await telegramClient.sendMessage(message.chat.id, "❌ Invalid limit.");
        return true;
      }
      updateData.muteThreshold = num;
    } else if (action === 'editWelc') {
      updateData.welcomeMessage = value;
    } else if (action === 'editFare') {
      updateData.farewellMessage = value;
    }

    if (Object.keys(updateData).length > 0) {
      let settings = await prisma.groupSettings.update({ where: { groupId }, data: updateData });
      
      // If it was a spam sub-menu setting, we return them to the sub-menu or main menu. Let's just return to main menu for simplicity.
      const markup = buildSettingsMenu(settings, groupId);
      await telegramClient.sendMessage(message.chat.id, `✅ **Setting updated for ${group.groupName}**`, { parse_mode: 'Markdown', reply_markup: markup });
    }

    return true; // We handled a force reply
  } catch (err: any) {
    logger.error({ err, userId }, 'Failed to process force reply');
    return false;
  }
}
