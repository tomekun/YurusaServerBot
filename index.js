
const { promises: fsPromises, ...fs } = require('fs');
const path = require("path")
require('dotenv').config();

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
  GatewayIntentBits,
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

//Token設定の確認

if (process.env['DISCORD_BOT_TOKEN'] == undefined) {
  console.error("TOKENが設定されていません。");
  process.exit(0);
}//token照合

console.log("起動準備中...")

//ログイン
client.login(process.env['DISCORD_BOT_TOKEN']);

//Readyイベント発火

client.once("ready", async() => {
  func.register(client,clientId,Collection,REST,Routes,path,fs)
  server.keepServer()
  console.log("起動完了");
  console.log(`Logged in as ${client.user.tag}!`);
  
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

const interval = setInterval(()=>{func.surveillance()}, 10000); // 10秒 = 10000ミリ秒

process.on('SIGINT', () => {
  func.clearInterval(interval);

  console.log('Intervalが停止しました。');
});


const MAX_MENTIONS = 5;
const rinkPoints = new Map();
const message_vPoints = new Map();
const heatmessageCount = new Map();
const mentionCount = new Map();
const timeoutCount = new Map();
const TIMEOUT_THRESHOLD = 5;
const ADMIN_USER_ID = '880634631467196496';
const RESET_TIMEOUT_MINUTES = 10;
let strictMode = true;

// グローバルスコープに inviteRegex を定義
const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/g;

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const currentTime = Date.now();

  const mentions = message.mentions.users.size > 0 || message.mentions.roles.size > 0 || message.mentions.everyone;
  if (mentions) handleMentions(message, userId, currentTime);

  if (inviteRegex.test(message.content)) handleInviteLinks(message, userId);

  if (heatmessageCount.has(userId)) handleSpamMessages(message, userId, currentTime);


  checkStrictMode(message.guild.id);
});

client.on('guildMemberAdd', async member => {
  if (strictMode === true) {
    // メッセージを送信し、Kickする
    await member.send('現在サーバーが複数人のユーザによって荒らされている可能性があります。しばらくしてから再度参加をお試しください。');
    setTimeout(()=>{
    member.kick('strictModeが有効なため新しいメンバーをKickしました。');
    },3000)

    console.log(`Kicked ${member.user.tag} due to security mode.`);
  }
});//サーバー閉鎖(自動)

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
});//サーバー閉鎖(手動)


function handleMentions(message, userId, currentTime) {
  if (!mentionCount.has(userId)) mentionCount.set(userId, []);
  const timestamps = mentionCount.get(userId).filter(timestamp => currentTime - timestamp < 30 * 1000);
  timestamps.push(currentTime);
  mentionCount.set(userId, timestamps);

  if (timestamps.length > MAX_MENTIONS) {
    applyTimeout(message, userId, 'メンションのスパム', strictMode ? 1 : 2);
  }
}

function handleInviteLinks(message, userId) {
  const inviteLinks = message.content.match(inviteRegex);
  for (const link of inviteLinks) {
    const inviteCode = link.split('/').pop();
    client.fetchInvite(inviteCode).then(invite => {
      if (invite.guild.id !== message.guild.id) {
        applyTimeout(message, userId, '招待リンクのスパム', strictMode ? 1 : 3);
      }
    }).catch(console.error);
  }
}

function handleSpamMessages(message, userId, currentTime) {
  const timestamps = heatmessageCount.get(userId).filter(timestamp => currentTime - timestamp < 10000);
  timestamps.push(currentTime);
  heatmessageCount.set(userId, timestamps);

  if (timestamps.length > 9) {
    applyTimeout(message, userId, 'スパム', strictMode ? 1 : 3);
  }
}

function applyTimeout(message, userId, reason, threshold) {
  const points = (strictMode ? message_vPoints : rinkPoints).get(userId) || 0;
  (strictMode ? message_vPoints : rinkPoints).set(userId, points + 1);

  if (points + 1 >= threshold) {
    const member = message.guild.members.cache.get(userId);
    if (member) {
      member.timeout(20 * 60 * 1000, `${reason}によるタイムアウト（StrictMode: ${strictMode}）`);
      message.channel.send(`${message.author}は${reason}のため、StrictModeにより即時20分間のタイムアウトが適用されました。`);
      updateTimeoutCount(message.guild.id);
    }
    (strictMode ? message_vPoints : rinkPoints).delete(userId);
  } else {
    message.channel.send(`${message.author}, ${reason}が検出されました。違反ポイント: ${points + 1}/${threshold}`);
  }
}

function updateTimeoutCount(guildId) {
  const timeoutTotal = (timeoutCount.get(guildId) || 0) + 1;
  timeoutCount.set(guildId, timeoutTotal);

  if (timeoutTotal >= TIMEOUT_THRESHOLD && !strictMode) {
    strictMode = true;
    client.users.fetch(ADMIN_USER_ID).then(adminUser => {
      adminUser.send(`サーバー内でタイムアウトされたユーザーが${TIMEOUT_THRESHOLD}人を超えました。これによりStrictModeが有効になります。`);
      setTimeout(() => {
        timeoutCount.delete(guildId);
        strictMode = false;
        adminUser.send(`タイムアウトカウントがリセットされ、StrictModeが無効になりました。`);
      }, RESET_TIMEOUT_MINUTES * 60 * 1000);
    }).catch(console.error);
  }
}

function checkStrictMode(guildId) {
  if (timeoutCount.get(guildId) >= TIMEOUT_THRESHOLD && !strictMode) {
    strictMode = true;
  }
}
