const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ロール付与')
    .setDescription('一定の条件下でメンバーロールの付与します'),
  execute: async function(interaction) {
    const targetRoleId = '1264442203791429743'; // 対象のロールのID
    const newRoleId = '1264442203791429743'; // 追加する新しいロールのID

    const guild = interaction.guild;
    const members = await guild.members.fetch();

    members.forEach(member => {
        const hasTargetRole = member.roles.cache.has(targetRoleId);
        const hasOtherRoles = member.roles.cache.size > 1 && member.roles.cache.some(role => role.id !== targetRoleId);

        if (!hasTargetRole && hasOtherRoles) {
            member.roles.add(newRoleId)
                .then(() => console.log(`Added new role to ${member.user.tag}`))
                .catch(console.error);
        }
    });

    interaction.reply("完了");
  }
};
