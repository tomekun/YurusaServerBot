
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
  ButtonBuilder,
  ActionRowBuilder,
  GatewayIntentBits,
  PermissionsBitField,
} = require("discord.js");

//intents設定
const client = new Client({
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


const config = require('./config.json');

const rinkPoints = new Map();
const message_vPoints = new Map();
const heatmessageCount = new Map();
const mentionCount = new Map();
const timeoutCount = new Map();

const cooldown1 = config.mentionSpam.cooldown;
const count1 = config.mentionSpam.count;
const attention1 = config.mentionSpam.attention;
const timeout1 = config.mentionSpam.timeout;

const cooldown2 = config.spam.cooldown;
const count2 = config.spam.count;
const attention2 = config.spam.attention;
const timeout2 = config.spam.timeout;

const attention3 = config.rinkSpam.attention;  
const timeout3 = config.rinkSpam.timeout;

const numpeople = config.strictMode.num_people;
const strict_time = config.strictMode.strict_time;

const ADMIN_USER_ID = '958667546284920862';
let strictMode = false;

const inviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/g;
const urlRegex = /https?:\/\/[^\s]+/g;

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const currentTime = Date.now();

  if (message.mentions.users.size > 0 || message.mentions.roles.size > 0 || message.mentions.everyone) {
    handleMentions(message, userId, currentTime);
  }

  if (inviteRegex.test(message.content)||urlRegex.test(message.content)) {
    handleInviteLinks(message, userId);
  }

  handleSpamMessages(message, userId, currentTime);
  checkStrictMode(message.guild.id);
});

function handleMentions(message, userId, currentTime) {
  // ユーザーのメンションを処理
  if (!mentionCount.has(userId)) mentionCount.set(userId, []);
  const timestamps = mentionCount.get(userId).filter(timestamp => currentTime - timestamp < cooldown1 * 1000);
  timestamps.push(currentTime);
  mentionCount.set(userId, timestamps);

  // ユーザーのメンション回数が閾値を超えた場合
  if (timestamps.length > count1) {
    applyTimeout(message, userId, 'メンションのスパム', strictMode ? 1 : attention1, timeout1);
  }

  // ロールのメンションを処理
  const rolesMentioned = message.mentions.roles;
  rolesMentioned.forEach(role => {
    const roleId = role.id;
    if (!mentionCount.has(roleId)) mentionCount.set(roleId, []);
    const roleTimestamps = mentionCount.get(roleId).filter(timestamp => currentTime - timestamp < cooldown1 * 1000);
    roleTimestamps.push(currentTime);
    mentionCount.set(roleId, roleTimestamps);

    // ロールのメンション回数が閾値を超えた場合
    if (roleTimestamps.length > count1) {
      applyTimeout(message, userId, `ロール「${role.name}」のメンションスパム`, strictMode ? 1 : attention1, timeout1);
    }
  });
}

async function handleInviteLinks(message, userId) {
  
  const inviteLinks = message.content.match(inviteRegex);
  const urls = message.content.match(urlRegex);
  if (inviteLinks){
  for (const link of inviteLinks) {
    const inviteCode = link.split('/').pop();
    client.fetchInvite(inviteCode).then(invite => {
      if (invite.guild.id !== message.guild.id) {
        message.delete()
        applyTimeout(message, userId, '招待リンクのスパム', attention3, timeout3);
      }
    }).catch(console.error);
  }
  }
  if (urls){   
  for (const url of urls) {
      try {
          // ESMモジュールを動的にインポート
          const { fetchUrl } = await import('./fetchUrl.mjs');

          const text = await fetchUrl(url);

          if (text.includes('discord.gg')) {
              await message.delete();
              applyTimeout(message, userId, '招待リンクのスパム', attention3, timeout3);
              return;
          }
      } catch (error) {
          console.error('Error:', error);
      }
  }
  }
  
}

function handleSpamMessages(message, userId, currentTime) {
  if (!heatmessageCount.has(userId)) {
    heatmessageCount.set(userId, []);
  }

  const timestamps = heatmessageCount.get(userId).filter(timestamp => currentTime - timestamp < cooldown2 * 1000);
  timestamps.push(currentTime);
  heatmessageCount.set(userId, timestamps);

  if (timestamps.length > count2) {
    applyTimeout(message, userId, 'スパム', attention2, timeout2);
  }
}

function applyTimeout(message, userId, reason, threshold, timeout) {
  const points = (strictMode ? message_vPoints : rinkPoints).get(userId) || 0;
  (strictMode ? message_vPoints : rinkPoints).set(userId, points + 1);

  if (strictMode || points + 1 >= threshold) {
    const member = message.guild.members.cache.get(userId);
    if (member) {
      const timeoutDuration = strictMode ? strict_time : timeout;
      member.timeout(timeoutDuration * 60 * 1000, `${reason}によるタイムアウト（StrictMode: ${strictMode}）`)
        .then(() => {
          const timeoutMessage = strictMode 
            ? `${message.author}は${reason}のため、StrictModeにより即時${strict_time}分間のタイムアウトが適用されました。`
            : `${message.author}は${reason}のため、${timeout}分間のタイムアウトが適用されました。`;
          message.channel.send(timeoutMessage);
          updateTimeoutCount(message.guild.id);
        })
        .catch(console.error);
    }
    (strictMode ? message_vPoints : rinkPoints).delete(userId);
  } else {
    message.channel.send(`${message.author}, ${reason}が検出されました。違反ポイント: ${points + 1}/${threshold}`);
  }
}

function updateTimeoutCount(guildId) {
  const timeoutTotal = (timeoutCount.get(guildId) || 0) + 1;
  timeoutCount.set(guildId, timeoutTotal);

  if (timeoutTotal >= numpeople && !strictMode) {
    strictMode = true;
    client.users.fetch(ADMIN_USER_ID).then(adminUser => {
      adminUser.send(`サーバー内でタイムアウトされたユーザーが${numpeople}人を超えました。これによりStrictModeが有効になります。`);

      setTimeout(() => {
        timeoutCount.delete(guildId);
        strictMode = false;
        adminUser.send(`タイムアウトカウントがリセットされ、StrictModeが無効になりました。`);
      }, strict_time * 60 * 1000);
    }).catch(console.error);
  }
}

client.on('guildMemberUpdate', (oldMember, newMember) => {
  if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
    updateTimeoutCount(newMember.guild.id);
  }
});

function checkStrictMode(guildId) {
  if (timeoutCount.get(guildId) >= numpeople && !strictMode) {
    strictMode = true;
  }
}

client.on('guildMemberAdd', async member => {
  if (strictMode) {
    await member.send('現在サーバーが複数人のユーザによって荒らされている可能性があります。しばらくしてから再度参加をお試しください。');
    setTimeout(() => {
      member.kick('StrictModeが有効なため新しいメンバーをKickしました。');
    }, 3000);
    console.log(`Kicked ${member.user.tag} due to security mode.`);
  }
});

client.on('guildMemberAdd', async member => {
  const filePath = path.resolve(__dirname, 'torf.json');

  try {
    const data = await fsPromises.readFile(filePath, 'utf-8');
    const config = JSON.parse(data);

    if (config.securitymode === 'true') {
      await member.send('現在サーバーが複数人のユーザによって荒らされている可能性があります。しばらくしてから再度参加をお試しください。');
      setTimeout(() => {
        member.kick('セキュリティモードのため新しいメンバーをKickしました。');
      }, 3000);
      console.log(`Kicked ${member.user.tag} due to security mode.`);
    }
  } catch (error) {
    console.error('Error reading or parsing torf.json:', error);
  }
});

const buttonkit = require('./button.js');


let bmessage;
let brole;
let bcid;
let bephe;

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        if (interaction.commandName === "button") {
            const solt = Math.floor(1000 + Math.random() * 9000);
            const timestamp = Date.now();
            const bid = `${solt}`+timestamp
            // コマンドを実行しているユーザーのメンバーオブジェクトを取得
            const member = await interaction.guild.members.fetch(interaction.user.id);

            // コマンドを実行しているユーザーが管理者またはサーバー所有者であるかをチェック
            const hasPermission = member.permissions.has(PermissionsBitField.Flags.Administrator) || interaction.guild.ownerId === interaction.user.id;

            // roleオプションが指定されている場合、権限チェック
            const role = interaction.options.getRole('role');
            if (role && !hasPermission) {
              return interaction.reply({ content: 'このコマンドを実行するには、管理者権限が必要です。',ehpemeral: true });
            }

                const bname = interaction.options.getString('name');
                const btype = interaction.options.getString('type');
                bmessage = interaction.options.getString('sendmessage');
                brole = interaction.options.getRole('role');
                let bepheA = interaction.options.getBoolean('ephemeral');
                bephe = `${bepheA}`;
                bcid = `${bname}:${bid}`;

                const button = new ButtonBuilder()
                    .setCustomId(`${bcid}`)
                    .setLabel(`${bname}`)
                    .setStyle(`${btype}`);

                const row = new ActionRowBuilder().addComponents(button);

                await interaction.reply({ components: [row] });
                if (brole) {
                    brole = `${brole.name}`;
                } else {
                    brole = "";
                }
                buttonkit.saveDataToBcid(bcid, bmessage, brole, bephe);


        }
    } else if (interaction.isButton()) {
        console.log(interaction.customId);
        //await interaction.deferReply(); // 遅延応答

        try {
            const buttonData = func.loadButtonData();

          if (buttonData.hasOwnProperty(interaction.customId)) {
              const data = buttonData[interaction.customId];

              if (data.message) {
                  if (data.ephe === "true") {
                      await interaction.reply({ content: `${data.message}`, ephemeral: true });
                  } else {
                      console.log(data.message);
                      await interaction.reply({ content: data.message });
                  }
              }

              if (data.role) {
                  const role = interaction.guild.roles.cache.find(role => role.name === data.role);
                  if (role) {
                      try {
                          const member = interaction.guild.members.cache.get(interaction.user.id);
                          if (member) {
                              // すでにロールを持っている場合は剥奪する
                              if (member.roles.cache.has(role.id)) {
                                 console.log(`Removed role: ${role.name}`);
                                return await member.roles.remove(role);

                              }
                              // ロールを付与する
                              await member.roles.add(role);
                              console.log(`Added role: ${role.name}`);
                          } else {
                              await interaction.reply("ユーザーが見つかりません。");
                          }
                      } catch (e) {
                          await interaction.reply("ロールの付与に失敗しました。\nロール管理の権限がないか、このBOTのロールより上位のロールまたは無効なロールを付与しようとしています。");
                      }
                  } else {
                      await interaction.reply("ロールが見つかりません。");
                  }
              }
          }

        } catch (error) {
            console.error('Error handling button interaction:', error);
            await interaction.editReply("エラーが発生しました。");
        }
    }
});

async function sendError(err) {
  const logFilePath = logErrorToFile(err);
  const channel = client.channels.cache.get('1273213512180699227');

  if (channel) {
      await channel.send({
          content: 'エラーが発生しました。',
          files: [logFilePath]
      });

      // 送信後に一時的なログファイルを削除
      fs.unlinkSync(logFilePath);
  }
}

// エラーメッセージをファイルに記録する関数
function logErrorToFile(err) {
  const logDir = path.join(__dirname, 'logs');
  const logFileName = `error_${Date.now()}.log`;
  const logFilePath = path.join(logDir, logFileName);

  // ログディレクトリが存在しない場合は作成
  if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
  }

  // エラーメッセージとスタックトレースをログファイルに書き込み
  const errorMessage = `[${new Date().toISOString()}] ${err.stack || err}\n\n`;
  fs.writeFileSync(logFilePath, errorMessage, 'utf8');

  return logFilePath;
}

process.on('uncaughtException', (err) => {
  sendError(err);
});
/*
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = message.content.match(urlRegex);

    if (!urls) return;

    for (const url of urls) {
        try {
            // ESMモジュールを動的にインポート
            const { fetchUrl } = await import('./fetchUrl.mjs');

            const text = await fetchUrl(url);

            if (text.includes('discord.gg')) {
                await message.delete();

                return;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
});
*/
