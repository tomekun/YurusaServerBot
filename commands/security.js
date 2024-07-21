const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
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
    if (boolean) {
      fs.writeFileSync('../torf.json', JSON.stringify({ secritymode: 'true' }));
      
    } else {
      fs.writeFileSync('../torf.json', JSON.stringify({ secritymode: 'false' }));
    }
  }
};
