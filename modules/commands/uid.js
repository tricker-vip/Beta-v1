const axios = require('axios');

module.exports.config = {
    name: "uid",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "KyPhan",
    description: "Lấy ID người dùng hoặc người được reply hoặc từ liên kết Facebook.",
    commandCategory: "Tiện ích",
    cooldowns: 0
};

module.exports.run = async ({ api, event, args }) => {
    try {
        let userID;

        if (args[0] && args[0].includes("facebook.com")) {
            // Nếu tin nhắn chứa liên kết Facebook
            const urlMatch = args[0].match(/facebook.com\/([^/?]+)/);
            if (!urlMatch) {
                throw new Error("Liên kết Facebook không hợp lệ.");
            }
            const username = urlMatch[1];

            // Gửi yêu cầu đến API công cộng để lấy UID từ username
            const response = await axios.get(`https://sumiproject.io.vn/facebook/uid?link=https://www.facebook.com/${username}`);
            const data = response.data;

            if (data && data.id) {
                userID = data.id;
            } else {
                throw new Error("Không thể lấy UID từ liên kết Facebook.");
            }
        } else if (event.type === "message_reply") {
            userID = event.messageReply.senderID;
        } else {
            userID = event.senderID;
        }

        api.sendMessage(`${userID}`, event.threadID, event.messageID);
    } catch (err) {
        api.sendMessage("Có lỗi xảy ra, vui lòng thử lại sau.", event.threadID, event.messageID);
        console.error(err);
    }
};