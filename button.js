const fs = require('fs'); // fs モジュールを使用して同期操作を行う
const filePath = "data/buttonData.json"
// ...

// データを読み込む関数
const loadButtonData = () => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading button data:', error);
    return {};
  }
};

// データを保存する関数
const saveButtonData = (data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving button data:', error);
  }
};

// bcid の内部にデータを保存する関数
const saveDataToBcid = (bcid, bmessage, brole, bephe) => {
  let message = bmessage;
  let role = brole;
  let ephe = bephe;
  const buttonData = loadButtonData();
  if (!message) {
    message = "ボタンが押されました!";
    ephe = "true";
  }
  if (role === "@everyone") {
    role = "";
  }
  if (!ephe && message) {
    ephe = "";
  }
  buttonData[bcid] = { message, role, ephe };
  saveButtonData(buttonData);
};

// bcid のデータを取得する関数
const getDataFromBcid = (bcid) => {
  const buttonData = loadButtonData();
  return buttonData[bcid] || {};
};

module.exports = {
  saveDataToBcid,
  getDataFromBcid,
};