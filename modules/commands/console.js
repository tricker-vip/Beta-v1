const fs = require('fs');
const moment = require('moment-timezone');
const chalk = require('chalk');

module.exports.config = {
  name: "console",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "iamvanquyen",
  description: "console đơn giản",
  commandCategory: "Admin",
  usages: "console",
  cooldowns: 30
};

var isConsoleDisabled = false;
var num = 0;
var max = 25;
var timeStamp = 0;
var messageCount = 0;
var userMessageCount = {};
var groupMessageCount = {};

function clearConsole() {
  setInterval(() => {
    console.clear();
    console.log("Console đã được làm mới");
  }, 60000);
}

function logToFile(data) {
  fs.appendFileSync('modules/commands/data/console_log.txt', `${data}\n`, 'utf8');
}

function disableConsole(cooldowns) {
  console.log(chalk.yellow(`Chế độ chống lag console đã được kích hoạt trong ${cooldowns}s`));
  isConsoleDisabled = true;
  setTimeout(() => {
    isConsoleDisabled = false;
    console.log(chalk.green("Chế độ chống lag đã tắt"));
  }, cooldowns * 1000);
}

function limitConsoleLines(maxLines = 100) {
  let lines = console.history || [];
  if (lines.length > maxLines) {
    console.clear();
    console.log("Console đã vượt quá số dòng giới hạn, xóa console...");
  }
}

function saveConsoleState() {
  setInterval(() => {
    const state = {
      time: moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY"),
      messageCount,
      userMessageCount,
      groupMessageCount
    };
    fs.writeFileSync('modules/commands/data/console_state.txt', JSON.stringify(state, null, 2), 'utf8');
    console.log("Trạng thái console đã được lưu");
  }, 300000);
}

function createFrame(type, threadName, senderName, messageBody) {
  const borderLength = 40;

  const formatLine = (label, value, color) => {
    const line = `${label}: ${value}`;
    return `║ ${chalk[color](line.padEnd(borderLength - 4))} ║`;
  };

  const title = `${type.toUpperCase()}`;
  const formattedTitle = `║ ${chalk.yellow(title.padEnd(borderLength - 4))} ║`;

  let frame = `
╔${'═'.repeat(borderLength - 2)}╗
${formattedTitle}
╠${'═'.repeat(borderLength - 2)}╣
${formatLine('Nhóm', threadName, 'cyan')}
${formatLine('Tên', senderName, 'yellow')}
${formatLine('Tin nhắn', messageBody, 'red')}
╚${'═'.repeat(borderLength - 2)}╝`;

  return frame;
}

module.exports.handleEvent = async function ({ api, Users, event }) {
  let { threadID, senderID, isGroup } = event;

  try {
    if (isConsoleDisabled) return;

    let currentTime = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");
    const senderName = await Users.getNameUser(senderID);
    const messageBody = event.body || "Ảnh, video hoặc kí tự đặc biệt";

    let type = isGroup ? "CHAT TRONG NHÓM" : "RIÊNG TƯ";
    let threadName = "Không có";

    if (isGroup) {
      const threadInfo = await api.getThreadInfo(threadID);
      threadName = threadInfo.threadName || "No Name";
    }

    const infoFrame = createFrame(type, threadName, senderName, messageBody);
    console.log(infoFrame);

    logToFile(infoFrame);

    userMessageCount[senderID] = (userMessageCount[senderID] || 0) + 1;
    groupMessageCount[threadID] = (groupMessageCount[threadID] || 0) + 1;

    if (messageCount % 50 === 0) {
      console.log(chalk.blue(`Đã nhận được ${messageCount} tin nhắn!`));
    }

    messageCount++;

    if (Date.now() - timeStamp > 1000) {
      if (num <= max) num = 0;
    }
    if (Date.now() - timeStamp < 1000 && num >= max) {
      num = 0;
      disableConsole(this.config.cooldowns);
    }

    timeStamp = Date.now();
    limitConsoleLines();
  } catch (error) {
    console.log(error);
  }
};

module.exports.run = async function () {
  console.log("Console module đã hoạt động...");
  clearConsole();
  saveConsoleState();
};