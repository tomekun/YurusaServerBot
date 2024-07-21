
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

client.on("ready", () => {
  func.register(client,clientId,Collection,REST,Routes,path,fs)
  server.keepServer()
  console.log("起動完了");
});

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


client.on('messageCreate', (message) => {
  const { author, content } = message;

  if (author.bot) return;

  // ユーザーごとにカウントを追跡
  const userTimeouts = timeouts.get(author.id) || { count: 0, timeout: null };

  // 直近のメッセージと比較して同じであればカウントを増やす
  if (userTimeouts.lastMessage === content) {
    userTimeouts.count++;
  } else {
    userTimeouts.count = 1;
  }
try{
  // 5秒以内に3回以上同じメッセージを送信した場合
  if (userTimeouts.count >= 3 && userTimeouts.count < 7) {
    if (!userTimeouts.timeout) {
      // タイムアウトを設定
      message.member.timeout(10 * 1000);

      // タイムアウトをユーザーに通知
      message.channel.send(`<@!${author.id}>`+"スパム防止の為10秒間のタイムアウト");
    }

  }
  if (userTimeouts.count >= 7 && userTimeouts.count < 20) {
    if (!userTimeouts.timeout) {
      // タイムアウトを設定
      message.member.timeout(20 * 1000);

      // タイムアウトをユーザーに通知
      message.channel.send(`<@!${author.id}>`+"スパム防止の為20秒間のタイムアウト");
    }
  if (userTimeouts.count >= 20) {
      message.member.timeout(1000*60*60*12);

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
  }, "5000");


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
