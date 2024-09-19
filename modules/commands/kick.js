module.exports.config = {
    name: "kick",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "D-Jukie",
    description: "Xoá người bạn cần xoá khỏi nhóm bằng cách tag hoặc reply",
    commandCategory: "Qtv",
    images: [],
    usages: "[tag/reply/all]",
    cooldowns: 0
};

module.exports.run = async function ({ args, api, event, Threads, Users }) {
    try {
        const threadInfo = (await Threads.getData(event.threadID)).threadInfo;
        const { participantIDs, adminIDs } = threadInfo;
        const botID = api.getCurrentUserID();
        const isUserAdmin = adminIDs.some(admin => admin.id == event.senderID);
        const botAdmins = global.config.ADMINBOT || [];  // Mảng chứa ID các admin của bot
        const isBotAdmin = botAdmins.includes(event.senderID);

        // Kiểm tra quyền quản trị viên của người sử dụng lệnh
        if (!isUserAdmin) {
            return api.sendMessage("❎ Bạn cần là quản trị viên của nhóm để sử dụng lệnh này.", event.threadID, event.messageID);
        }

        // Kiểm tra nếu người dùng muốn sử dụng lệnh "kick all"
        if (args[0] === "all") {
            // Kiểm tra xem người dùng có phải là admin của bot không
            if (!isBotAdmin) {
                return api.sendMessage("❎ Bạn cần là admin của bot để sử dụng lệnh 'kick all'.", event.threadID, event.messageID);
            }

            const listUserID = participantIDs.filter(ID => ID != botID && ID != event.senderID);
            if (listUserID.length === 0) return api.sendMessage("❎ Không có người nào để kick.", event.threadID, event.messageID);

            api.sendMessage(`🔄 Bắt đầu kick ${listUserID.length} thành viên...`, event.threadID);
            for (const idUser of listUserID) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await api.removeUserFromGroup(idUser, event.threadID);
            }
            return api.sendMessage("✅ Đã kick tất cả thành viên thành công.", event.threadID, event.messageID);

        } else if (event.type === "message_reply") {
            const uid = event.messageReply.senderID;
            await api.removeUserFromGroup(uid, event.threadID);
            return api.sendMessage("✅ Đã kick thành công thành viên.", event.threadID, event.messageID);

        } else if (args.join().indexOf('@') !== -1) {
            const mention = Object.keys(event.mentions);
            api.sendMessage(`🔄 Bắt đầu kick ${mention.length} thành viên...`, event.threadID);
            for (const uid of mention) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await api.removeUserFromGroup(uid, event.threadID);
            }
            return api.sendMessage("✅ Đã kick thành công các thành viên.", event.threadID, event.messageID);

        } else {
            return api.sendMessage("❎ Vui lòng tag hoặc reply người cần kick.", event.threadID, event.messageID);
        }

    } catch (error) {
        console.error(error);
        return api.sendMessage("❎ Lỗi khi kick người dùng.", event.threadID, event.messageID);
    }
};