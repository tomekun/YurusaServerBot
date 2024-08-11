const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverdata_get')
    .setDescription('現在のサーバー情報を取得します')
    ,
  execute: async function(interaction) {
    const guild = interaction.guild;
    function getServerInformation(guild) {
      const channels = guild.channels.cache;
      const serverData = [];
      const japanTime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      const japanDate = new Date(japanTime);
      var synthesisTime =　`${japanDate.getHours()}:${japanDate.getMinutes()}:${japanDate.getSeconds()}:${japanDate.getMilliseconds()}`
      var synthesisDate = `${japanDate.getMonth()+1}/${japanDate.getDate()}-${synthesisTime}` 

      channels.forEach((channel) => {
        if (channel.type === 4) {
          const categoryData = {
            //time: channel.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            time:synthesisDate,
            name: channel.name,
            id: channel.id,
            type: 4,
            channels: [],
          };

          channels.forEach((subChannel) => {
            if (subChannel.parentId === channel.id) {
              categoryData.channels.push({
                name: subChannel.name,
                id: subChannel.id,
                type: subChannel.type === 0 ? 0 : 2,
              });
            }
          });

          serverData.push(categoryData);
        }
      });

      const uncategorizedChannels = channels.filter(channel => !channel.parent);
      uncategorizedChannels.forEach(channel => {
        if (channel.type != 4 ){ 
        serverData.push({
          name: channel.name,
          id: channel.id,
          type: channel.type === 0 ? 0 : 2,
        });
        }
      });

      const serverDataJson = JSON.stringify(serverData, null, 2);
      const jsonFileName = `./commands/ServerData/serverData:${synthesisTime}.json`;
      fs.writeFileSync(jsonFileName, JSON.stringify(serverData, null, 2));
      console.log('チャンネルとカテゴリー情報をJSONファイルに保存しました.');

      return serverDataJson;
    }
    getServerInformation(guild);
    interaction.reply("サーバーの情報を取得しました")
}};
