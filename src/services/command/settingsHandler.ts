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

function buildSettingsMenu(settings: any, groupId: string) {
  const keyboard = [
    [
      { text: `Anti-Spam: ${settings.antiSpamEnabled ? '✅ ON' : '❌ OFF'}`, callback_data: `set_toggleSpam_${groupId}` }
    ],
    [
      { text: `Edit Spam Threshold (${settings.spamThresholdMsg}m/${settings.spamThresholdTime}s)`, callback_data: `set_spamThresh_${groupId}` },
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

    if (action === 'toggleSpam') {
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
    } else if (action === 'spamThresh' || action === 'warnLimit' || action === 'muteLimit' || action === 'editWelc' || action === 'editFare') {
      // Force Reply Pattern
      let prompt = '';
      if (action === 'spamThresh') prompt = `Please reply to this message with the new spam threshold format: "messages/seconds" (e.g. "5/10")\n\n[ID:${groupId}|spamThresh]`;
      if (action === 'warnLimit') prompt = `Please reply to this message with the new Warn Limit (number).\n\n[ID:${groupId}|warnLimit]`;
      if (action === 'muteLimit') prompt = `Please reply to this message with the new Mute Limit (number).\n\n[ID:${groupId}|muteLimit]`;
      if (action === 'editWelc') prompt = `Please reply to this message with the new Welcome Message. Use {name} for the user's name.\n\n[ID:${groupId}|editWelc]`;
      if (action === 'editFare') prompt = `Please reply to this message with the new Farewell Message. Use {name} for the user's name.\n\n[ID:${groupId}|editFare]`;

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
  if (!message.reply_to_message || !message.reply_to_message.text) return false;
  if (!message.text) return false;

  const replyText = message.reply_to_message.text;
  const match = replyText.match(/\[ID:(.+)\|(.+)\]/);
  if (!match) return false;

  const groupId = match[1];
  const action = match[2];
  const value = message.text.trim();

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || !message.from) return false;

    const isAdmin = await isUserAdmin(group.telegramGroupId, message.from.id);
    if (!isAdmin) return false;

    const updateData: any = {};

    if (action === 'spamThresh') {
      const parts = value.split('/');
      if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
        updateData.spamThresholdMsg = parseInt(parts[0]);
        updateData.spamThresholdTime = parseInt(parts[1]);
      } else {
        await telegramClient.sendMessage(message.chat.id, "❌ Invalid format. Please use messages/seconds (e.g. 5/10).");
        return true;
      }
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
      const settings = await prisma.groupSettings.update({ where: { groupId }, data: updateData });
      const markup = buildSettingsMenu(settings, groupId);
      await telegramClient.sendMessage(message.chat.id, `✅ **Setting updated for ${group.groupName}**`, { parse_mode: 'Markdown', reply_markup: markup });
    }

    return true; // Indicates we handled a force reply
  } catch (err: any) {
    logger.error({ err, groupId }, 'Failed to process force reply');
    return false;
  }
}
