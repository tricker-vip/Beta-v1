module.exports.config = {
  name: "qtv",
  version: "1.0.1",
  hasPermission: 1,
  credits: "KyPhan",
  description: "Quản lý QTV trong nhóm: thêm, xóa hoặc liệt kê QTV",
  commandCategory: "box",
  usages: "[add/kick/list] [uid]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;
  const action = args[0] ? args[0].toLowerCase() : null;

  try {
    const threadInfo = await api.getThreadInfo(threadID);

    // Kiểm tra quyền QTV của bot
    if (!threadInfo.adminIDs.some(admin => admin.id == api.getCurrentUserID())) {
      return api.sendMessage("⚠️ Bot chưa được thêm lên làm QTV. Vui lòng thêm bot lên làm QTV để sử dụng lệnh này.", threadID, messageID);
    }

    if (action === "add") {
      let mentionID, userName;
      const targetMessageID = event.messageReply ? event.messageReply.messageID : messageID;

      if (args[1]) {
        mentionID = args[1];
        const userInfo = await Users.getData(mentionID);
        userName = userInfo.name;
      } else if (Object.keys(event.mentions).length > 0) {
        mentionID = Object.keys(event.mentions)[0];
        userName = event.mentions[mentionID].replace("@", "");
      } else if (event.messageReply) {
        mentionID = event.messageReply.senderID;
        const userInfo = await Users.getData(mentionID);
        userName = userInfo.name;
      } else {
        return api.sendMessage("⚠️ Bạn cần tag người dùng, reply tin nhắn hoặc cung cấp UID để thăng cấp lên làm QTV.", threadID, messageID);
      }

      await api.changeAdminStatus(threadID, mentionID, true);

      return api.sendMessage({
        body: `✅ ${userName} đã được thăng cấp lên làm QTV!`,
        mentions: [{ tag: userName, id: mentionID }]
      }, threadID, targetMessageID);

    } else if (action === "kick") {
      let mentionID, userName;
      const targetMessageID = event.messageReply ? event.messageReply.messageID : messageID;

      if (args[1]) {
        mentionID = args[1];
        const userInfo = await Users.getData(mentionID);
        userName = userInfo.name;
      } else if (Object.keys(event.mentions).length > 0) {
        mentionID = Object.keys(event.mentions)[0];
        userName = event.mentions[mentionID].replace("@", "");
      } else if (event.messageReply) {
        mentionID = event.messageReply.senderID;
        const userInfo = await Users.getData(mentionID);
        userName = userInfo.name;
      } else {
        return api.sendMessage("⚠️ Bạn cần tag người dùng, reply tin nhắn hoặc cung cấp UID để xóa khỏi QTV.", threadID, messageID);
      }

      await api.changeAdminStatus(threadID, mentionID, false);

      return api.sendMessage({
        body: `❌ ${userName} đã bị xóa khỏi danh sách QTV!`,
        mentions: [{ tag: userName, id: mentionID }]
      }, threadID, targetMessageID);

    } else if (action === "list") {
      const adminList = threadInfo.adminIDs.map(admin => admin.id);
      let adminNames = [];

      for (const adminID of adminList) {
        const userInfo = await Users.getData(adminID);
        adminNames.push({ id: adminID, name: userInfo.name });
      }

      const listMessage = adminNames.map((admin, index) => `${index + 1}. ${admin.name}`).join("\n");

      // Gửi danh sách QTV kèm theo hướng dẫn
      api.sendMessage({
        body: `📜 Danh sách QTV trong nhóm:\n${listMessage}\n\nReply với số thứ tự để kick QTV tương ứng.`,
      }, threadID, (error, info) => {
        if (error) return api.sendMessage("❌ Đã xảy ra lỗi khi gửi danh sách QTV.", threadID, messageID);

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          adminList: adminNames,
          type: "kick",
        });
      });

    } else {
      return api.sendMessage("⚠️ Hãy sử dụng lệnh với các tùy chọn: add, kick, hoặc list.", threadID, messageID);
    }

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Có lỗi xảy ra, vui lòng thử lại sau.", threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (senderID !== handleReply.author) return;

  const selectedIndex = parseInt(body.trim()) - 1;
  const adminToKick = handleReply.adminList[selectedIndex];

  if (!adminToKick) return api.sendMessage("⚠️ Số thứ tự không hợp lệ, vui lòng thử lại.", threadID, messageID);

  try {
    await api.changeAdminStatus(threadID, adminToKick.id, false);
    return api.sendMessage(`❌ ${adminToKick.name} đã bị xóa khỏi danh sách QTV!`, threadID, messageID);
  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Có lỗi xảy ra, vui lòng thử lại sau.", threadID, messageID);
  }
};