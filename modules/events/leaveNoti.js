const fs = require('fs-extra'); 
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone'); // Import moment-timezone

module.exports.config = {
    name: "leaveNoti",
    eventType: ["log:unsubscribe"],
    version: "1.4.0", // Cập nhật version
    credits: "Ranz",
    description: "Thông báo Bot hoặc người dùng rời khỏi nhóm với thời gian, hiển thị thông báo tùy chỉnh và gửi video",
    dependencies: {
        "fs-extra": "",
        "path": "",
        "axios": "",
        "moment-timezone": "" // Add moment-timezone to dependencies
    }
};

module.exports.run = async function({ api, event, Threads }) {
    const { threadID, logMessageData } = event;
    const { leftParticipantFbId } = logMessageData;
    const threadInfo = await Threads.getInfo(threadID);

    let leftUserName;
    let leftUserProfileUrl = `https://facebook.com/${leftParticipantFbId}`;
    try {
        const userInfo = await api.getUserInfo(leftParticipantFbId);
        leftUserName = userInfo[leftParticipantFbId]?.name || "Người dùng";
    } catch (error) {
        leftUserName = "Người dùng";
        console.error("Failed to fetch user info:", error);
    }

    // Get current time in 'Asia/Ho_Chi_Minh' timezone
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const timeFormatted = now.format('HH:mm:ss');
    const dateFormatted = now.format('DD/MM/YYYY');

    // Determine the part of the day
    const hours = now.hour();
    let periodOfDay;
    if (hours < 6) {
        periodOfDay = "đêm";
    } else if (hours < 12) {
        periodOfDay = "sáng";
    } else if (hours < 17) {
        periodOfDay = "trưa";
    } else if (hours < 19) {
        periodOfDay = "chiều";
    } else {
        periodOfDay = "tối";
    }

    const msg = `${leftUserName} đã rời khỏi nhóm ${threadInfo.threadName} vào lúc ${timeFormatted} (${dateFormatted}) ${periodOfDay}. Bạn có thể xem hồ sơ của họ tại ${leftUserProfileUrl}`;
    console.log("Message to send:", msg); // Debugging line

    try {
        const videoUrl = (await axios.get('https://api.sumiproject.net/video/videoanime')).data.url;
        const videoStream = (await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream"
        })).data;

        await api.sendMessage({ body: msg, attachment: global.gaudev.splice(0, 1) }, threadID);
    } catch (error) {
        console.error("Failed to fetch video or send message:", error);
        await api.sendMessage({ body: msg }, threadID); // Send the message without the video
    }
};