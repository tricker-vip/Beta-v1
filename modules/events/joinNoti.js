const axios = require('axios'); // Thêm axios nếu chưa được cài đặt

module.exports.config = {
  name: "joinNoti",
  eventType: ["log:subscribe"],
  version: "1.0.1",
  credits: "CatalizCS mod by vdang",
  description: "Thông báo khi có người vào nhóm",
  dependencies: {}
};

module.exports.run = async function({ api, event }) {
  const moment = require("moment-timezone");
  
  const time = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY || HH:mm:ss");
  const { threadID } = event;
  
  try {
    // Tải video từ URL
    const videoUrl = (await axios.get('https://api.sumiproject.net/video/videoanime')).data.url;
    const videoStream = (await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream"
    })).data;
    
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      // Thông báo bot đang load
      await api.sendMessage("🔄 Bot đang load...", threadID);
      
      // Đặt thời gian trễ 30 giây
      setTimeout(async () => {
        await api.changeNickname(`『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME || ""}`, threadID, api.getCurrentUserID());
        await api.sendMessage(
          {
            body: `✅ Bot đã load thành công!\n📝 Hãy sử dụng ${global.config.PREFIX}menu all để xem toàn bộ lệnh của bot\n⛔ Vui lòng không spam bot để tránh bị khóa!`,
            attachment: global.gaudev.splice(0, 1)
          },
          threadID
        );
      }, 1500); // 30 giây = 30000 ms
    } else {
      const { threadName, participantIDs } = await api.getThreadInfo(threadID);
      const nameArray = event.logMessageData.addedParticipants.map(p => p.fullName);
      
      const msg = `👤 Xin chào bạn ${nameArray.join(', ')}\n🤟 Chào mừng đã đến với ${threadName}\n👥 Bạn là thành viên thứ ${participantIDs.length} của nhóm\n📌Bạn hãy tương tác đầy đủ nếu không muốn cút!\n🗓️ Thời gian hiện tại: ${time}`;
      
      return api.sendMessage(
        {
          body: msg,
          attachment: global.gaudev.splice(0, 1)
        },
        threadID
      );
    }
  } catch (error) {
    console.error('Lỗi khi gửi video:', error);
  }
};