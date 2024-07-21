
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
      message.channel.send(`<@!${author.id}>`+"スパム防止の為10秒間のタイムアウト");
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