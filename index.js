
const { promises: fsPromises, ...fs } = require('fs');
var request = require('request');
const path = require("path")
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cheerio = require('cheerio');
const { promisify } = require('util');

//ファイルの読み込み

const {clientId} = require('./config.json');
const func = require("./func.js")
const server = require('./server.js'); 

const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';
const { google } = require('googleapis');

const {
  REST,
  Routes,
  Client,
Partials,
  Collection,
  EmbedBuilder,
  ModalBuilder, 
  ActivityType,
  ButtonBuilder,
  TextInputStyle,
  TextInputBuilder, 
  ActionRowBuilder,
  GatewayIntentBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");

//intents設定
const client = new Client({
  ws: { properties: { $browser: "Discord iOS" } },
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Channel,
    Partials.Message
  ]
});

//変数
const timeouts = new Map();//スパム対策

//Token設定の確認

if (process.env['DISCORD_BOT_TOKEN'] == undefined) {
  console.error("TOKENが設定されていません。");
  process.exit(0);
}//token照合

console.log("起動準備中...")

//ログイン
client.login(process.env['DISCORD_BOT_TOKEN']);

//Readyイベント発火
const guildId = '1264736036316119113';
const channelId = '1264736036316119116';

client.once("ready", async() => {
  func.register(client,clientId,Collection,REST,Routes,path,fs)
  server.keepServer()
  console.log("起動完了");
  console.log(`Logged in as ${client.user.tag}!`);
  const guild = client.guilds.cache.get(guildId); // 指定されたギルドを取得
  if (guild) {
      await updateMemberCount(guild);
  } else {
      console.log('Guild not found');
  }
});

client.on('guildMemberAdd', async member => {
  if (member.guild.id === guildId) {
      await updateMemberCount(member.guild);
  }
});

client.on('guildMemberRemove', async member => {
  if (member.guild.id === guildId) {
      await updateMemberCount(member.guild);
  }
});

async function updateMemberCount(guild) {
  const channel = guild.channels.cache.get(channelId);
  if (channel) {
      const memberCount = guild.memberCount;
      await channel.setName(`Members: ${memberCount}`);
      console.log(`Updated channel name to: Members: ${memberCount}`);
  } else {
      console.log('Channel not found');
  }
}


client.on('interactionCreate', async interaction => {
    try{
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`${interaction.commandName} が見つかりません。`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
    }
    }catch(e){

      interaction.channel.send("システムエラーが発生したようです…修正されるまで少しお時間いただけますか？")
    }
  });//スラッシュコマンド設定


client.on('messageCreate', async (message) => {
  const filePath = path.resolve(__dirname, 'torf.json');

  try {
    // torf.jsonを読み込み
    const data = await fsPromises.readFile(filePath, 'utf-8');
    const config = JSON.parse(data);

  const { author, content } = message;

  if (author.bot) return;

  // ユーザーごとにカウントを追跡
  const userTimeouts = timeouts.get(author.id) || { count: 0, timeout: null };

  // 直近のメッセージと比較して同じであればカウントを増やす
    if (config.spam.trackSameMessage) {
      if (userTimeouts.lastMessage === content) {
          userTimeouts.count++;
      } else {
          userTimeouts.count = 1;
          userTimeouts.lastMessage = content;
      }
    } else {
      userTimeouts.count++;
    }
try{
  // 5秒以内に3回以上同じメッセージを送信した場合
  if (userTimeouts.count >= config.count && userTimeouts.count < config.count+2) {
    if (!userTimeouts.timeout) {
      // タイムアウトを設定
      message.member.timeout(10 * 1000);
      message.delete();
      // タイムアウトをユーザーに通知
      message.channel.send(`<@!${author.id}>`+"スパム防止の為10秒間のタイムアウト");
    }

  }
  if (userTimeouts.count >= config.count+2 && userTimeouts.count < config.count+4) {
    if (!userTimeouts.timeout) {
      // タイムアウトを設定
      message.member.timeout(20 * 1000);
      message.delete();
      // タイムアウトをユーザーに通知
      message.channel.send(`<@!${author.id}>`+"スパム防止の為20秒間のタイムアウト");
    }
  if (userTimeouts.count >= config.count+4) {
      message.member.timeout(1000*60*60*12);
      message.delete();
      // タイムアウトをユーザーに通知
      message.channel.send(`<@!${author.id}>`+"スパム防止の為12時間のタイムアウト、他の運営が対応するのを待つか、12時間お待ち下さい。");

    }  

  }  
  else {
    clearTimeout(userTimeouts.timeout);
    userTimeouts.timeout = null;

  }
  }catch(e){console.log("エラー。権限が不足してないか等を確認してください\nerror:"+e)}
  userTimeouts.lastMessage = content;
  timeouts.set(author.id, userTimeouts);
  console.log(userTimeouts.count)
  setTimeout(() => {
    userTimeouts.count = 0;
  }, config.time*1000);

  }catch(e){}
});

const userTokenWarningMap = new Map();

client.on('messageCreate', (message) => {
  const { content, author, guild } = message;
  const tokenPattern = /[a-zA-Z0-9_-]{23,28}\.[a-zA-Z0-9_-]{6,7}\.[a-zA-Z0-9_-]{27}/;

  // メッセージの内容で正規表現を検査
  if (tokenPattern.test(content)) {
    message.delete()
    const userId = author.id;

    // ユーザーの警告情報を取得または初期化
    let userWarnings = userTokenWarningMap.get(userId) || 0;

    if (userWarnings === 0) {
      // ユーザーが初めてトークンを貼り付けた場合、警告を送信
      message.channel.send('警告：トークンを公開しないでください。再度繰り返された場合あなたをBANします。\nWarning: do not reveal tokens. If repeated again you will be blocked.');
      userWarnings++;
      userTokenWarningMap.set(userId, userWarnings);
    } else if (userWarnings === 1) {
      // ユーザーが2度目にトークンを貼り付けた場合、キック
      const member = guild.members.cache.get(userId);
      if (member) {
        member.ban('トークンの公開が続いたため対象のユーザーをBANしました。').then(() => {
          message.channel.send('トークンの公開が続いたため、BANされました。\nYou have been blocked.Because you ignored warnings and issued tokens');
        }).catch((error) => {
          console.error('キックエラー:', error);
        });
      }
      // 警告情報をリセット
      userTokenWarningMap.delete(userId);
    }
  }
});

client.on('messageCreate', async (message) => {
  // ボット自身のメッセージは無視
  if (message.author.bot) return;

  // メッセージの解析リクエストを作成
  const analyzeRequest = {
    comment: {
      text: message.content     
    },
    requestedAttributes: {
      TOXICITY: {}
    }
  };

  try {
    const googleClient = await google.discoverAPI(DISCOVERY_URL);

    // コメントの解析リクエストを送信
    const response = await googleClient.comments.analyze({
      key: API_KEY,
      resource: analyzeRequest,
    });

    // 評価点数が一定以上の場合に　警告 を送信
    const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;
    const threshold = 0.7; // この値は適切な閾値に調整
    if (toxicityScore >= threshold) {

      message.channel.send(`<@!${message.member.user.id}>他人が不愉快になるメッセージを送信するのはやめましょう`);

    }
    if (toxicityScore >= threshold) {
      message.delete();
    }
  } catch (err) {
    console.error(err);
    console.log('An error occurred while analyzing the message.');
  }
});//誹謗中傷防止
const roleIdsToCheck = ['1264442203791429743'];

/*
client.on('messageCreate', async (message) => {
    // 自分のメッセージには反応しない
    if (message.author.bot) return;

    // メッセージに@everyoneまたは指定されたロールが含まれているかチェック
    if (message.mentions.has(message.guild.roles.everyone) ||
        roleIdsToCheck.some(roleId => message.mentions.has(message.guild.roles.cache.get(roleId)))) {
        // メッセージ送信者が管理者権限を持っていない場合
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            try {
                // メッセージを削除
                await message.delete();
                console.log(`Deleted a message from ${message.author.tag} that mentioned @everyone or specified roles`);
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }
    }
});
*/
let messageCount = 0;

client.on('messageCreate', (message) => {

    // メッセージのカウントを増やす
    messageCount++;
      setTimeout(() => {
        if (messageCount >= 11) {
          // スパムとみなす条件を満たす場合、スパム検知メッセージを送信
          message.member.kick('スパムが続いたため');
        }
        // カウントをリセット
        messageCount = 0;
      }, 10000); // 10秒間待つ


});

// メンバーがサーバーに参加したときのイベント
client.on('guildMemberAdd', async member => {
  const filePath = path.resolve(__dirname, 'torf.json');

  try {
    // torf.jsonを読み込み
    const data = await fsPromises.readFile(filePath, 'utf-8');
    const config = JSON.parse(data);

    if (config.securitymode === 'true') {
      // メッセージを送信し、Kickする
      await member.send('現在サーバーが複数人のユーザによって荒らされている可能性があります。しばらくしてから再度参加をお試しください。');
      setTimeout(()=>{
      member.kick('セキュリティモードのため新しいメンバーをKickしました。');
      },3000)

      console.log(`Kicked ${member.user.tag} due to security mode.`);
    }
  } catch (error) {
    console.error('Error reading or parsing torf.json:', error);
  }
});

const mentionCount = new Map(); // ユーザーごとのメンション数を保持するマップ
const mentionTimers = new Map(); // ユーザーごとのリセットタイマーを保持するマップ

client.on('messageCreate', async message => {
    if (message.author.bot) return; // ボットのメッセージは無視
  const filePath = path.resolve(__dirname, 'config.json');
try{
  // torf.jsonを読み込み
  const data = await fsPromises.readFile(filePath, 'utf-8');
  const config = JSON.parse(data);
    const mentions = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
    if (mentions > 0) {
        const userId = message.author.id;

        if (!mentionCount.has(userId)) {
            mentionCount.set(userId, 0);
        }

        mentionCount.set(userId, mentionCount.get(userId) + mentions);

        // リセットタイマーの設定
        if (mentionTimers.has(userId)) {
            clearTimeout(mentionTimers.get(userId)); // 既存のタイマーをクリア
        }
        const resetTimer = setTimeout(() => {
            mentionCount.delete(userId); // メンション数をリセット
            mentionTimers.delete(userId); // タイマーをリセット
        }, 5 * 60 * 1000);
        mentionTimers.set(userId, resetTimer);

        if (mentionCount.get(userId) >= config.mspam) {
            // タイムアウト処理
            const member = message.guild.members.cache.get(userId);
            if (member) {
                member.timeout(1000*60*60*2)
                    .then(() => {
                        message.channel.send(`${member} has been timed out for excessive mentions.`);
                        mentionCount.delete(userId); // タイムアウト後にカウントをリセット
                        clearTimeout(mentionTimers.get(userId)); // タイマーをクリア
                        mentionTimers.delete(userId); // タイマーを削除
                    })
                    .catch(console.error);
            }
        }
    }
  }catch(e){}
});
const deletedChannels = new Map();

client.on('channelDelete', async (channel) => {
  deletedChannels.set(channel.id, {
      name: channel.name,
      type: channel.type,
      parentID: channel.parentID,
      position: channel.position,
      topic: channel.topic,
      nsfw: channel.nsfw,
      rateLimitPerUser: channel.rateLimitPerUser,
      bitrate: channel.bitrate,
      userLimit: channel.userLimit
  });
  console.log(`Channel deleted: ${channel.name}`);
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!restoreChannel')) {
      const args = message.content.split(' ');
      const channelId = args[1];

      if (deletedChannels.has(channelId)) {
          const channelData = deletedChannels.get(channelId);
          const restoredChannel = await message.guild.channels.create(channelData.name, {
              type: channelData.type,
              parent: channelData.parentID,
              position: channelData.position,
              topic: channelData.topic,
              nsfw: channelData.nsfw,
              rateLimitPerUser: channelData.rateLimitPerUser,
              bitrate: channelData.bitrate,
              userLimit: channelData.userLimit
          });
          deletedChannels.delete(channelId);
          message.reply(`Channel restored: ${restoredChannel.name}`);
      } else {
          message.reply('No channel found with that ID.');
      }
  }
});



const interval = setInterval(()=>{func.surveillance()}, 10000); // 10秒 = 10000ミリ秒

process.on('SIGINT', () => {
  func.clearInterval(interval);

  console.log('Intervalが停止しました。');
});
