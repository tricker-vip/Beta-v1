const moment = require("moment-timezone");

// Lưu thời gian bắt đầu toàn cục
let botStartTime = moment();

module.exports.config = {
  name: "restart",
  version: "2.0.2",
  hasPermission: 10, // Đảm bảo chỉ admin có quyền sử dụng lệnh
  credits: "Mirai Team mod by Jukie",
  description: "Khởi động lại bot",
  commandCategory: "Admin",
  usages: "restart",
  cooldowns: 5,
  dependencies: {}
}

module.exports.run = async function({ api, args, Users, event }) {
  const { threadID, senderID } = event;

  // Kiểm tra quyền của người thực hiện lệnh
  if (event.senderID !== senderID) {
    return api.sendMessage("Bạn không có quyền sử dụng lệnh này.", threadID);
  }

  // Lấy thời gian hiện tại
  const currentTime = moment.tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");

  // Tính thời gian hoạt động của bot
  const uptimeDuration = moment.duration(moment().diff(botStartTime));
  const uptime = `${uptimeDuration.hours()}:${uptimeDuration.minutes()}:${uptimeDuration.seconds()}`;

  // Lấy tên người thực hiện lệnh
  let name;
  try {
    name = await Users.getNameUser(senderID);
  } catch (error) {
    name = 'Người dùng không xác định';
  }

  // Gửi thông báo và khởi động lại bot
  api.sendMessage(`⌚ Thời gian hiện tại: ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')}\n⏳ Thời gian hoạt động: ${uptime}\n👤 Người yêu cầu: ${name}`, threadID, () => process.exit(1));
}

// Đảm bảo cập nhật thời gian bắt đầu khi bot khởi động
module.exports.initialize = function() {
  botStartTime = moment(); // Cập nhật thời gian bắt đầu khi bot khởi động
}