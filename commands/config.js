const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('BOTの設定')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('spam')
        .setDescription('何秒間に何回でスパムとするかまた、メッセージの追跡設定ができます')
        .addIntegerOption((option) =>
          option
            .setName('time')
            .setDescription('スパムとする時間 (秒)')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('count')
            .setDescription('スパム認定となる回数')
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName('track_same_message')
            .setDescription('同じメッセージの追跡のみにするか')
            .setRequired(false)
        ))
    .addSubcommand((subcommand) =>
          subcommand
          .setName('mention_spam')
          .setDescription('メンションのスパム設定。何回メンションした場合タイムアウトにするかを設定できます')
            .addIntegerOption((option) =>
            option
              .setName('count')
              .setDescription('スパム認定となる回数')
              .setRequired(true)
              .setMinValue(3) 
              .setMaxValue(10) 
        )
             .addIntegerOption((option) =>
             option
               .setName('time')
               .setDescription('監視時間の幅を設定できます（秒数で指定）')
               .setRequired(true)
               .setMinValue(10) 
               .setMaxValue(60*5) 
                   )
    ),
  execute: async function(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'spam') {
      const time = interaction.options.getInteger('time');
      const count = interaction.options.getInteger('count');
      const trackSameMessage = interaction.options.getBoolean('track_same_message');

      // 設定を読み込む
      let config;
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath);
        config = JSON.parse(data);
      } else {
        config = {};
      }

      // スパム設定を更新
      config.spam = {
        time: time,
        count: count,
        trackSameMessage: trackSameMessage
      };

      // 設定を保存
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await interaction.reply(`スパム設定が更新されました。\n時間: ${time}秒\n回数: ${count}回\n同じメッセージの追跡のみにする: ${trackSameMessage}`);
    }
    if (subcommand === 'mention_spam') {
      const count = interaction.options.getInteger('count');
      const time = interaction.options.getInteger('time');
      
      let config;
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath);
        config = JSON.parse(data);
      } else {
        config = {};
      }
      
      config.mspam = {
        count:count,
        time:time
      }
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await interaction.reply(`メンションスパム設定が更新されました。回数: ${count}回`);
    }
  }
};
