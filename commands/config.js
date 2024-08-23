const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('BOTの設定を行います')
    .addSubcommand(subcommand =>
      subcommand
        .setName('supamu')
        .setDescription('スパムの設定')
        .addIntegerOption(option => option.setName('cooldown').setDescription('クールダウンの秒数を指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('count').setDescription('許容連投回数を指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('attention').setDescription('何回目の注意でタイムアウトにするか指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('timeout').setDescription('タイムアウトの分数を指定してください').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('mention_supam')
        .setDescription('メンションスパムの設定')
        .addIntegerOption(option => option.setName('cooldown').setDescription('クールダウンの秒数を指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('count').setDescription('許容メンション回数を指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('attention').setDescription('何回目の注意でタイムアウトにするか指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('timeout').setDescription('タイムアウトの分数を指定してください').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rink_spam')
        .setDescription('許可されていないサーバー招待リンクスパムの設定')
        .addIntegerOption(option => option.setName('cooldown').setDescription('クールダウンの秒数を指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('count').setDescription('許容招待リンク回数を指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('attention').setDescription('何回目の注意でタイムアウトにするか指定してください').setRequired(true))
        .addIntegerOption(option => option.setName('timeout').setDescription('タイムアウトの分数を指定してください').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('strictmode')
        .setDescription('strictmodeを設定')
        .addIntegerOption(option => option.setName('num_people').setDescription('レイド判定人数').setRequired(true))
        .addIntegerOption(option => option.setName('strict_time').setDescription('strictmodeの分数').setRequired(true))
    ),

  execute: async function(interaction) {
    const configPath = path.join(__dirname, '..', 'config.json');
    let config = {};

    // config.jsonファイルを読み込む
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    const subcommand = interaction.options.getSubcommand();

    switch(subcommand) {
      case 'supamu':
        config.spam = {
          cooldown: interaction.options.getInteger('cooldown'),
          count: interaction.options.getInteger('count'),
          attention: interaction.options.getInteger('attention'),
          timeout: interaction.options.getInteger('timeout'),
        };
        break;
      case 'mention_supam':
        config.mentionSpam = {
          cooldown: interaction.options.getInteger('cooldown'),
          count: interaction.options.getInteger('count'),
          attention: interaction.options.getInteger('attention'),
          timeout: interaction.options.getInteger('timeout'),
        };
        break;
      case 'rink_spam':
        config.rinkSpam = {
          cooldown: interaction.options.getInteger('cooldown'),
          count: interaction.options.getInteger('count'),
          attention: interaction.options.getInteger('attention'),
          timeout: interaction.options.getInteger('timeout'),
        };
        break;
      case 'strictmode':
        config.strictMode = {
          num_people: interaction.options.getInteger('num_people'),
          strict_time: interaction.options.getInteger('strict_time'),
        };
        break;
    }

    // 設定をconfig.jsonに保存する
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    await interaction.reply({ content: '設定が保存されました。', ephemeral: true });
  }
};
