const { load } = require("cheerio");
const fs = require("fs")
const path = require("path")

async function register(client, clientId, Collection, REST, Routes, path, fs) {
  client.commands = new Collection();

  const commandsPath = path.join(__dirname, 'commands');
  const commands = [];
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());

    // コマンドを client.commands に登録
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`${file} に必要な "data" か "execute" がありません (連絡必須)`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env['DISCORD_BOT_TOKEN']);

  const maxRetries = 2;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`${commandFiles.length} 個のアプリケーションコマンドを登録します`);

      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );

      console.log(`${data.length} 個のアプリケーションコマンドを登録しました。`);
      break; // 登録成功した場合はループを抜ける
    } catch (error) {
      console.error('Error registering commands:', error);
      if (error.code === 20012) {
        console.log(`Retrying registration... Attempt ${attempt + 1} of ${maxRetries}`);
        attempt++;
        // アプリIDの再取得（必要に応じてファイルから再読み込みする処理を追加）
        const { appId } = require('./appid.json');
        clientId = appId; // アプリIDの再設定（必要に応じて調整）
      } else {
        throw error; // 他のエラーが発生した場合は再試行せずにエラーをスロー
      }
    }
  }

  if (attempt === maxRetries) {
    console.error('Max retries reached. Failed to register commands.');
  }
}

function getServerInformation(guild) {
  try{
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
  const jsonFileName = `./ServerData/serverData:${synthesisTime}.json`;
  fs.writeFileSync(jsonFileName, JSON.stringify(serverData, null, 2));
  console.log('チャンネルとカテゴリー情報をJSONファイルに保存しました.');

  return serverDataJson;
    
}catch(e){console.log("復元用チャンネルの取得に失敗（連絡必須）"+e)}
}

function surveillance() {
  const folderPath = './ServerData'; // フォルダーのパスを指定
  const maxFileCount = 5;

  // フォルダー内のファイルを取得
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('ファイル一覧の取得エラー(連絡必須):', err);
      return;
    }

    if (files.length > maxFileCount) {
      if (files.length <= 4) return;
      // ファイル数が5つ以上の場合、一番古いファイルを削除
      const sortedFiles = files.map((fileName) => {
        const filePath = path.join(folderPath, fileName);
        const fileStat = fs.statSync(filePath);
        return { name: fileName, date: fileStat.mtime };
      });

      sortedFiles.sort((a, b) => a.date - b.date);
      const fileToDelete = sortedFiles[0].name;
      const filePathToDelete = path.join(folderPath, fileToDelete);

      fs.unlink(filePathToDelete, (error) => {
        if (error) {
          console.error('ファイル削除失敗(無視可能):', error);
        } else {
          console.log(`一番古いファイル '${fileToDelete}' を削除しました。`);
        }
      });
    }

    if (files.length > maxFileCount) {
      if (files.length <= 4) return;
      const fileToDelete = files[0]; // 一番上のファイルを取得

      // ファイルを削除
      fs.unlink(`${folderPath}/${fileToDelete}`, (err) => {
        if (err) {
          console.error('ファイル削除失敗(無視可能):', err);
        } else {
          console.log(`File '${fileToDelete}' deleted successfully.`);
        }
      });
    }
  });


}

function loadButtonData() {
  try{
  const data = fs.readFileSync('./data/buttonData.json', 'utf8');

  return JSON.parse(data);
  }catch(e){console.log("データが存在しません(無視可能)")}
}
function readAppIdFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    return json.appid; // `appid` を含むキーの名前を正確に指定してください
  } catch (error) {
    console.error('Error reading appid from file:', error);
    return null;
  }
}
module.exports = {
  loadButtonData,
  surveillance,
  getServerInformation,
  register,
  readAppIdFromFile,
}