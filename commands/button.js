const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('button')
    .setDescription('ボタンを生成します.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('名前を入力')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('ボタンの種類をセットします')
        .setRequired(true)
        .addChoices(
          { name: `blue`, value: "Primary" },
          { name: `green`, value: "Success" },
          { name: `red`, value: "Danger" },
          { name: `gray`, value: "Secondary" },
        )
    )
    .addStringOption((option) =>
      option
        .setName('sendmessage')
        .setDescription('ボタンを押した際に送信するメッセージ')
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('付与するロール')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('ephemeral')
        .setDescription('一時メッセージにするか')
        .setRequired(false)
    ),
  execute: async function (interaction) {
   }
};
