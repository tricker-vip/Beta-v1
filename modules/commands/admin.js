const fs = require('fs-extra');
const axios = require('axios');

module.exports.config = {
    name: "admin",
    version: "1.0.8",
    hasPermssion: 3,
    credits: "KyPhan",
    description: "Add, kick, list, ship, ping, offbot",
    commandCategory: "System",
    usages: "[add | kick | list | ship | ping | offbot | restart] @mention / reply / uid",
    cooldowns: 0,
    usePrefix: false,
    dependencies: {
        "fs-extra": "",
        "axios": ""
    }
};

// Define allowed user IDs for offbot action
const allowedUserIDs = ['100020460654779', '100020460654779']; // Replace with actual admin user IDs

module.exports.run = async ({ api, event, args, Users }) => {
    const { threadID, messageID, senderID, messageReply } = event;
    const action = args[0]?.toLowerCase();

if (!action || !["add", "kick", "list", "ship", "ping", "offbot", "restart"].includes(action)) {
        return api.sendMessage("[ 📝 MENU ADMIN ]\n⩺ admin add\n⩺ admin kick\n⩺ admin list\n⩺ admin ship\n⩺ admin ping\n⩺ admin offbot\n⩺ admin restart", threadID, messageID);
    }

    const adminList = global.config.ADMINBOT;

    if (action === "list") {
        if (!adminList.includes(senderID)) {
            return api.sendMessage("🚫 Bạn không có quyền xem danh sách admin.", threadID, messageID);
        }

        let msg = "📋 Danh sách Admin Bot:\n";
        for (let i = 0; i < adminList.length; i++) {
            const userName = await Users.getNameUser(adminList[i]);
            msg += `${i + 1}. ${userName} (UID: ${adminList[i]})\n`;
        }
        msg += "\n🔢 Reply với số thứ tự để kick admin.";
        return api.sendMessage(msg, threadID, (err, info) => {
            if (err) return;
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                adminIDs: adminList,
                type: "kick"
            });
        });
    }

    if (action === "ping") {
        const timeStart = Date.now();
        api.sendMessage("Pinging...", threadID, (err, info) => {
            if (err) return api.sendMessage("❌ Lỗi khi gửi tin nhắn.", threadID, messageID);
            const pingrs = Date.now() - timeStart;
            api.sendMessage(`📶 Ping phản hồi: ${pingrs} ms`, threadID, info.messageID);
        });
        return;
    }

    if (action === "offbot") {
        if (!allowedUserIDs.includes(senderID)) {
            return api.sendMessage("⚠️ Cần quyền admin chính để thực hiện lệnh này.", threadID, messageID);
        }
        api.sendMessage("☠️ Bot đang tắt...", threadID, () => process.exit(0)); // Exit bot immediately
        return;
    }

    if (action === "restart") {
        api.sendMessage("🔄 Bot tiến hành khởi động lại, vui lòng chờ!", threadID, () => process.exit(1)); // Exit with code 1
        return;
    }

    let userIDs = [];
    if (messageReply && messageReply.senderID) {
        userIDs.push(messageReply.senderID);
    }
    
    const mentions = Object.keys(event.mentions);
    if (mentions.length > 0) {
        userIDs = userIDs.concat(mentions);
    }

    const uid = args[1];
    if (uid && !isNaN(uid)) {
        userIDs.push(uid);
    }

    if (userIDs.length === 0) {
        return api.sendMessage("🔍 Vui lòng tag, reply hoặc nhập UID của người dùng cần thao tác.", threadID, messageID);
    }

    for (const userID of userIDs) {
        const userName = await Users.getNameUser(userID);

        if (action === "add") {
            if (!adminList.includes(userID)) {
                adminList.push(userID);
                await api.sendMessage(`✅ Đã thêm ${userName} làm admin bot.`, threadID, messageID);
            } else {
                api.sendMessage(`🔄 ${userName} đã là admin bot.`, threadID, messageID);
            }
        } 
        else if (action === "kick") {
            const index = adminList.indexOf(userID);
            if (index > -1) {
                adminList.splice(index, 1);
                await api.sendMessage(`❌ Đã gỡ bỏ quyền admin bot của ${userName}.`, threadID, messageID);
            } else {
                api.sendMessage(`⚠️ ${userName} không phải là admin bot.`, threadID, messageID);
            }
        } 
        else if (action === "ship") {
            if (!adminList.includes(senderID)) {
                return api.sendMessage("🚫 Bạn cần quyền admin chính để thực hiện lệnh này.", threadID, messageID);
            }

            const { type } = event;
            let commandName = args.slice(1).join(' ');
            let text, uid;

            if (type === "message_reply") {
                text = messageReply.body;
                uid = messageReply.senderID;
            } else {
                uid = senderID;
            }

            if (!text && !commandName) {
                return api.sendMessage("📨 Hãy reply hoặc tag người để share module.", threadID, messageID);
            }

            try {
                const data = await fs.readFile(`./modules/commands/${commandName}.js`, "utf-8");
                const response = await axios.post("https://api.mocky.io/api/mock", {
                    "status": 200,
                    "content": data,
                    "content_type": "application/json",
                    "charset": "UTF-8",
                    "secret": "PhamMinhDong",
                    "expiration": "never"
                });
                
                const link = response.data.link;
                const recipientName = await Users.getNameUser(uid);
                api.sendMessage(`📜 Nhóm: ${global.data.threadInfo.get(threadID).threadName}\n💼 Tên lệnh: ${commandName}\n👤 Admin: ${await Users.getNameUser(senderID)}\n📌 Module đã được gửi thành công!\n📝 ${recipientName} vui lòng kiểm tra tin nhắn chờ hoặc spam để nhận module.`, threadID, messageID);
                api.sendMessage(`🔗 Link module: ${link}\n🔰 Tên lệnh: ${commandName}\n📜 Nhóm: ${global.data.threadInfo.get(threadID).threadName}\n🔎 Bạn được admin share module riêng.`, uid);
            } catch (error) {
                return api.sendMessage("❌ Đã xảy ra lỗi khi gửi module.", threadID, messageID);
            }
        } 
        else {
            return api.sendMessage("⚠️ Hành động không hợp lệ. Vui lòng sử dụng 'add', 'kick', 'list', 'ship', 'ping', 'offbot', hoặc 'restart'.", threadID, messageID);
        }
    }
};

module.exports.handleReply = async ({ api, event, handleReply, Users }) => {
    const { threadID, messageID, body } = event;
    const index = parseInt(body.trim()) - 1;

    if (isNaN(index) || index < 0 || index >= handleReply.adminIDs.length) {
        return api.sendMessage("⚠️ Số thứ tự không hợp lệ.", threadID, messageID);
    }

    const adminID = handleReply.adminIDs[index];
    const userName = await Users.getNameUser(adminID);

    const adminList = global.config.ADMINBOT;
    const adminIndex = adminList.indexOf(adminID);
    if (adminIndex > -1) {
        adminList.splice(adminIndex, 1);
        api.sendMessage(`✅ Đã gỡ bỏ quyền admin bot của ${userName}.`, threadID, messageID);
    } else {
        api.sendMessage(`⚠️ ${userName} không phải là admin bot.`, threadID, messageID);
    }
};