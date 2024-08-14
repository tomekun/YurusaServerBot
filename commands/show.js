const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show_config')
        .setDescription('BOTの設定内容を表示します'),
    async execute(interaction) {
        try {
            // config.jsonを読み込む
            const configPath = path.join(__dirname, '../config.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);

            // 設定内容を整形
            const message = `
              **BOTの設定内容**

              **Strict Mode**
               ・レイド判定人数: ${config.strictMode.num_people}
               ・アンチレイド期間: ${config.strictMode.strict_time} 分

              **Spam Settings**
               ・間隔: ${config.spam.cooldown} 秒
               ・許容連投回数: ${config.spam.count}
               ・注意回数: ${config.spam.attention-1}
               ・Timeout: ${config.spam.timeout} 分

              **Rink Spam Settings**
               ・注意回数: ${config.rinkSpam.attention-1}
               ・Timeout: ${config.rinkSpam.timeout} 分

              **Mention Spam Settings**
               ・間隔: ${config.mentionSpam.cooldown} 秒
               ・許容連投回数: ${config.mentionSpam.count}
               ・注意回数: ${config.mentionSpam.attention-1}
               ・Timeout: ${config.mentionSpam.timeout} 分

            `;

            // メッセージを送信
            await interaction.reply({ content: message, ephemeral: true });
        } catch (error) {
            console.error('設定ファイルの読み込み中にエラーが発生しました:', error);
            await interaction.reply({ content: '設定ファイルの読み込み中にエラーが発生しました。', ephemeral: true });
        }
    },
};
