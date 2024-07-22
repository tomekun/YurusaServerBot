const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('securitymode')
    .setDescription('サーバーを一時的に閉鎖します')
    .addBooleanOption((option) =>
      option
        .setName('boolean')
        .setDescription('選択')
        .setRequired(true)
    ),
  execute: async function(interaction) {
    const boolean = interaction.options.getBoolean('boolean');
    // torf.jsonのパスを設定
    const filePath = path.resolve(__dirname, '../torf.json');

    try {
      // ファイルに書き込む内容を設定
      const data = { securitymode: boolean.toString() };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Security mode set to ${boolean}. File updated at ${filePath}`);
      await interaction.reply('セキュリティモードの設定を更新しました。');
    } catch (error) {
      console.error('Error writing to file:', error);
      await interaction.reply('エラーが発生しました。もう一度お試しください。');
    }
  }
};
