const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('messagedelete2')
    .setDescription('指定したユーザとメッセージ件数に基づき削除します')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('ユーザ選択')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('del_num')
        .setDescription('削除するメッセージの件数を指定')
        .setRequired(true)
    ),
  execute: async function(interaction) {
    const user = interaction.options.getUser('user');
    const num = interaction.options.getInteger('del_num');
    const channel = interaction.channel;

    if (!channel.isTextBased()) {
      await interaction.reply({ content: 'このコマンドはテキストチャンネルでのみ使用可能です。', ephemeral: true });
      return;
    }

    // メッセージの削除中であることを伝える
    await interaction.deferReply({ ephemeral: true });

    let messagesDeleted = 0;
    let lastMessageId = null;

    try {
      while (messagesDeleted < num) {
        const fetchOptions = { limit: 50 };
        if (lastMessageId) {
          fetchOptions.before = lastMessageId;
        }

        const messages = await channel.messages.fetch(fetchOptions);
        const targetMessages = messages.filter(msg => msg.author.id === user.id);

        if (targetMessages.size === 0) {
          break;
        }

        for (const msg of targetMessages.values()) {
          if (messagesDeleted >= num) break;

          await msg.delete();
          messagesDeleted++;
          console.log(`削除したメッセージ数: ${messagesDeleted}`);

          // 1件ごとに640ミリ秒待機
          await new Promise(resolve => setTimeout(resolve, 640));
        }

        if (messages.size < 50) {
          break;
        }

        lastMessageId = messages.last().id;
      }

      await interaction.editReply({ content: `ユーザー ${user.tag} のメッセージを ${messagesDeleted} 件削除しました。` });
    } catch (error) {
      console.error('メッセージ削除中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'メッセージ削除中にエラーが発生しました。' });
    }
  },
};
