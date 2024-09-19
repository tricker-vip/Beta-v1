const ADMIN_ID = "100020460654779";
const fs = require('fs');
const crypto = require('crypto');
const moment = require('moment-timezone');

const keysFilePath = __dirname + '/data/keys.json';
const dataFilePath = __dirname + '/data/thuebot.json';
const balancesFilePath = __dirname + '/data/balances.json';

let keysData = fs.existsSync(keysFilePath) ? require(keysFilePath) : [];
let data = fs.existsSync(dataFilePath) ? require(dataFilePath) : [];
let balances = fs.existsSync(balancesFilePath) ? require(balancesFilePath) : {};

const saveKeys = () => fs.writeFileSync(keysFilePath, JSON.stringify(keysData, null, 2));
const saveData = () => fs.writeFileSync(dataFilePath, JSON.stringify(data));
const saveBalances = () => fs.writeFileSync(balancesFilePath, JSON.stringify(balances));

const listKeys = (userId) => {
    // Liệt kê tất cả các key không bị kích hoạt
    const inactiveKeys = keysData.filter(k => !k.activated);
    
    if (inactiveKeys.length === 0) {
        return "Trống ❎"; // Return message if no inactive keys are found
    }
    
    return inactiveKeys.map((key, index) => {
        const userName = global.data.userName.get(key.creatorId) || key.creatorId;
        return `${index + 1}. ${key.key}\nNgười sở hữu: ${userName}\nThời gian hết hạn: ${moment().add(key.days, 'days').format('DD/MM/YYYY')}`;
    }).join('\n________________\n');
};

const generateKey = (creatorId, days = 30, ownerId, isAdminKey = false) => {
    const key = `KeyBot_${crypto.randomBytes(2).toString('hex')}_©2024`;
    keysData.push({ key, activated: false, creatorId, days, ownerId, isAdminKey });
    saveKeys();
    return key;
};

const activateKey = (key, userId) => {
    const keyEntry = keysData.find(k => k.key === key && !k.activated);
    if (!keyEntry) return false;

    keyEntry.activated = true;
    keyEntry.time_start = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
    keyEntry.time_end = moment().add(keyEntry.days, 'days').format('DD/MM/YYYY');
    saveKeys();
    return { time_end: keyEntry.time_end, days: keyEntry.days };
};

const extendRental = (userId, threadId, days = 30) => {
    const existingRental = data.find(entry => entry.id === userId && entry.t_id === threadId);
    let time_end;

    if (existingRental) {
        existingRental.time_end = moment(existingRental.time_end, 'DD/MM/YYYY').add(days, 'days').format('DD/MM/YYYY');
        time_end = existingRental.time_end;
    } else {
        const time_start = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
        time_end = moment().add(days, 'days').format('DD/MM/YYYY');
        data.push({ t_id: threadId, id: userId, time_start, time_end });
    }

    saveData();
    return time_end;
};

const addMoney = (userId, amount) => {
    if (!balances[userId]) balances[userId] = 0;
    balances[userId] += amount;
    saveBalances();
};

const checkBalance = userId => {
    return balances[userId] || 0;
};

const purchaseKey = (userId, days) => {
    const keyCost = days; // 1$ mỗi ngày
    const currentBalance = checkBalance(userId);
    if (currentBalance < keyCost) return { success: false, neededAmount: keyCost - currentBalance };
    balances[userId] -= keyCost;
    const newKey = generateKey(userId, days, userId, false); // truyền false cho isAdminKey
    saveBalances();

    return { success: true, newKey };
};

module.exports.config = {
    name: 'rent',
    version: '1.3.7',
    hasPermssion: 0,
    credits: 'DC-Nam & DongDev source lại & gấu thêm key',
    description: 'thuê bot',
    commandCategory: 'Admin',
    usages: '[]',
    cooldowns: 5,
    usePrefix: false,
};

exports.run = function (o) {
    const send = (msg, callback) => o.api.sendMessage(msg, o.event.threadID, callback, o.event.messageID);
    const t_id = o.event.threadID;
    const userId = o.event.type === "message_reply" ? o.event.messageReply.senderID : Object.keys(o.event.mentions)[0] || o.event.senderID;
    const time_start = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
    const time_end = moment().add(30, 'days').format('DD/MM/YYYY');

    const args = o.args;

    switch (args[0]) {
        case 'add': {
            if (o.event.senderID != ADMIN_ID) {
                return send(`⚠️ Chỉ Admin chính mới có thể sử dụng lệnh này!`);
            }

            if (!o.args[1]) {
                return send(`⚠️ Thêm người thuê bot vào dữ liệu:\n - thuebot add + ngày hết hạn\n - thuebot add + id người thuê + ngày hết hạn\n - thuebot add id nhóm + id người thuê + ngày hết hạn\n⚠️ Lưu ý: định dạng ngày là DD/MM/YYY`);
            }

            let userId = o.event.senderID;
            if (o.event.type === "message_reply") {
                userId = o.event.messageReply.senderID;
            } else if (Object.keys(o.event.mentions).length > 0) {
                userId = Object.keys(o.event.mentions)[0];
            }

            let t_id = o.event.threadID;
            let id = userId;
            let time_start = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
            let time_end = o.args[1];

            if (o.args.length === 4 && !isNaN(o.args[1]) && !isNaN(o.args[2]) && o.args[3].match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                t_id = o.args[1];
                id = o.args[2];
                time_end = o.args[3];
            } else if (o.args.length === 3 && !isNaN(o.args[1]) && o.args[2].match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                id = o.args[1];
                time_end = o.args[2];
            }

            if (isNaN(id) || isNaN(t_id)) {
                return send(`⚠️ ID Không Hợp Lệ!`);
            }

            if (!moment(time_end, 'DD/MM/YYYY', true).isValid()) {
                return send(`⚠️ Thời Gian Không Hợp Lệ!`);
            }

            data.push({
                t_id,
                id,
                time_start,
                time_end,
            });

            saveData();
            send(`☑️ Đã thêm người thuê bot vào danh sách!`);
            break;
        }
        case 'list': {
            if (o.event.senderID != ADMIN_ID) {
                return send(`⚠️ Chỉ Admin chính mới có thể sử dụng lệnh này!`);
            }
            const list = data.map(($, i) => {
                const userName = global.data.userName.get($.id) || $.id;
                const threadName = (global.data.threadInfo.get($.t_id) || {}).threadName || $.t_id;
                const status = new Date(moment($.time_end, 'DD/MM/YYYY').tz('Asia/Ho_Chi_Minh')).getTime() >= Date.now() ? '✅' : '❎';
                return `${i + 1}. ${userName}\nTình trạng: ${status}\nNhóm: ${threadName}`;
            }).join('\n__________________\n');

            send(`[ DANH SÁCH THUÊ BOT ]\n__________________\n${list}\n__________________\n⩺ Reply stt, del, out, giahan`, (err, res) => {
                res.name = exports.config.name;
                res.event = o.event;
                res.data = data;
                global.client.handleReply.push(res);
            });
            break;
        }
        case 'listkey': {
    if (o.event.senderID !== ADMIN_ID) {
        return send(`⚠️ Chỉ Admin chính mới có thể sử dụng lệnh này!`);
    }

    // Get the list of inactive keys for the current user
    const inactiveKeysList = listKeys(o.event.senderID);
    
    if (inactiveKeysList === "Trống ❎") {
        return send(`[ Key chưa activated ]\n\nTrống ❎`);
    }

    send(`[ Key chưa activated ]\n\n${inactiveKeysList}\n\n⩺ Reply rm + stt để xóa`, (err, res) => {
        if (err) {
            console.error(`Error sending message: ${err}`);
            return send(`⚠️ Đã xảy ra lỗi khi gửi danh sách key.`);
        }
        res.name = exports.config.name;
        res.event = o.event;
        res.data = keysData;
        global.client.handleReply.push(res);
    });
    break;
}
case 'newkey': {
    if (o.event.senderID !== ADMIN_ID) {
        return send(`⚠️ Chỉ Admin chính mới có thể sử dụng lệnh này!`);
    }

    // Parse the number of days from the arguments
    const days = parseInt(args[1], 10);
    if (isNaN(days) || days <= 0) {
        return send(`⚠️ Số ngày không hợp lệ. Vui lòng nhập một số hợp lệ.`);
    }
const result = purchaseKey(userId, days);
    send(`🔑 Key mới đã được tạo: ${result.newKey}\n🕒 Thời gian hiệu lực: ${days} ngày.`);
    break;
}
        case 'crekey': {
            if (o.event.senderID != ADMIN_ID) {
                return send(`⚠️ Chỉ Admin chính mới có thể sử dụng lệnh này!`);
            }
            const days = args[1] ? parseInt(args[1], 10) : 30;
            if (isNaN(days) || days <= 0) return send(`⚠️ Số ngày không hợp lệ. Vui lòng nhập một số hợp lệ.`);
            send(`🔑 Key mới: ${generateKey(userId, days, null, true)}\n🕒 Số ngày: ${days}`);
            break;
        }
        case 'bank': {
            if (o.event.senderID != ADMIN_ID) {
                return send(`⚠️ Chỉ Admin chính mới có thể sử dụng lệnh này!`);
            }

            let targetUserId;
            if (args.length === 3) {
                targetUserId = args[1];
            } else if (o.event.type === "message_reply") {
                targetUserId = o.event.messageReply.senderID;
            } else if (Object.keys(o.event.mentions).length > 0) {
                targetUserId = Object.keys(o.event.mentions)[0];
            } else {
                return send(`⚠️ Sử dụng: ${global.config.PREFIX}rent bank <userId | @mention | reply> <amount>`);
            }

            const amount = parseFloat(args[args.length - 1]);
            if (isNaN(amount)) {
                return send(`⚠️ Số tiền không hợp lệ. Vui lòng nhập một số hợp lệ.`);
            }

            addMoney(targetUserId, amount);
            send(`☑️ Đã cộng ${amount}$ vào tài khoản của người dùng ${global.data.userName.get(targetUserId) || targetUserId}.`);
            break;
        }
        case 'money': {
            const balance = checkBalance(userId);
            send(`💰 Số dư: ${balance}$`);
            break;
        }
        case 'me': {
            const inactiveKeysList = listKeys(userId);
            send(`[ my key no activated ]\n\n${inactiveKeysList}`);
            break;
        }
        case 'buy': {
            const days = parseInt(args[1], 10);
            if (isNaN(days) || days <= 0) return send(`⚠️ Số ngày không hợp lệ. Vui lòng nhập một số hợp lệ.`);
            
            // Gọi hàm mua key với số ngày được chọn
            const result = purchaseKey(userId, days);
            
            if (!result.success) return send(`⚠️ Bạn cần thêm ${result.neededAmount}$ để mua key này!.`);
            
            send(`✅ success: ${result.newKey}\n🕒 Số ngày: ${days}`);
            break;
        }
        default:
            send(`[ Danh sách lệnh rent ]\n⩺ Dành cho Admin\n${global.config.PREFIX}rent add\n${global.config.PREFIX}rent list\n${global.config.PREFIX}rent listkey\n${global.config.PREFIX}rent newkey\n${global.config.PREFIX}rent crekey\n${global.config.PREFIX}rent bank\n⩺ Dành cho người dùng\n${global.config.PREFIX}rent money ⩺ xem xố dư tài khoản\n${global.config.PREFIX}rent me ⩺ xem key nhóm mình\n${global.config.PREFIX}rent buy ⩺ nhập số ngày 1 ngày 1xu`);
    }
    saveData();
};

exports.handleReply = async function (o) {
    const send = (msg, callback) => o.api.sendMessage(msg, o.event.threadID, callback, o.event.messageID);
    if (o.event.senderID != o.handleReply.event.senderID) return;

    const args = o.event.body.split(' ');
    const action = args[0].toLowerCase();

    if (isFinite(action)) {
        const info = data[action - 1];
        if (!info) return send(`❎ STT không tồn tại!`);

        const time_diff = new Date(moment(info.time_end, 'DD/MM/YYYY').tz('Asia/Ho_Chi_Minh')).getTime() - Date.now();
        const rentalStatus = time_diff <= 0 ? "Đã hết thời hạn thuê 🔐" : "";

        return send(`[ THÔNG TIN NGƯỜI THUÊ BOT ]\n👤 Người thuê: ${global.data.userName.get(info.id) || info.id}\n🌐 Link Facebook: https://www.facebook.com/profile.php?id=${info.id}\n👥 Nhóm: ${(global.data.threadInfo.get(info.t_id) || {}).threadName || info.t_id}\n🔰 TID: ${info.t_id}\n📆 Ngày Thuê: ${info.time_start}\n⏳ Ngày hết Hạn: ${info.time_end} ${rentalStatus}`);
    } else {
        switch (action) {
            case 'del': {
                const sttList = args.slice(1).map(stt => parseInt(stt)).filter(stt => !isNaN(stt));
                if (sttList.length === 0) return send(`❎ Không có STT nào hợp lệ!`);
                
                sttList.sort((a, b) => b - a).forEach(stt => data.splice(stt - 1, 1));
                send(`☑️ Đã xóa thành công!`);
                saveData();
                break;
            }
            case 'giahan': {
                const stt = args[1];
                if (!data[stt - 1]) return send(`❎ STT không tồn tại`);
                const time_end = moment().add(30, 'days').format('DD/MM/YYYY');
                data[stt - 1].time_end = time_end;
                send(`☑️ Đã gia hạn nhóm thành công đến ngày ${time_end}!`);
                saveData();
                break;
            }
            case 'out': {
                for (const i of args.slice(1)) {
                    await o.api.removeUserFromGroup(o.api.getCurrentUserID(), data[i - 1].t_id);
                }
                send(`⚠️ Đã out nhóm theo yêu cầu`);
                break;
            }
            case 'rm': {
                const sttList = args.slice(1).map(stt => parseInt(stt)).filter(stt => !isNaN(stt));
                if (sttList.length === 0) return send(`❎ Không có STT nào hợp lệ!`);
                
                sttList.sort((a, b) => b - a).forEach(stt => keysData.splice(stt - 1, 1));
                send(`☑️ Đã xóa key thành công!`);
                saveKeys();
                break;
            }
            default: {
                send(`⚠️ Lệnh không hợp lệ!`);
                break;
            }
        }
    }
};

module.exports.handleEvent = function (o) {
    const activationResult = activateKey(o.event.body, o.event.senderID);
    if (activationResult) {
        const { time_end, days } = activationResult;
        const time_start = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
        const updatedTimeEnd = extendRental(o.event.senderID, o.event.threadID, days);
        saveData();
        
        // Cập nhật tên nhóm
        const expectedNickname = `『 ${global.config.PREFIX} 』 ⪼ ${(!global.config.BOTNAME) ? "ʙᴏᴛ ɢᴀᴜ (ʙᴇᴛᴀ)" : global.config.BOTNAME} | HSD ${time_end}`;
        o.api.changeNickname(expectedNickname, o.event.threadID, o.api.getCurrentUserID(), (error) => {
            if (error) {
                console.error(`Không thể thay đổi biệt danh bot: ${error}`);
            }
        });

        if (time_end !== updatedTimeEnd) {
            o.api.sendMessage(`☑️ Key hợp lệ! Bot đã được gia hạn thêm ${days} ngày.\n📆 Ngày bắt đầu: ${time_start}\n⏳ Ngày hết hạn: ${updatedTimeEnd}`, o.event.threadID);
        } else {
            o.api.sendMessage(`☑️ Key hợp lệ! Bot đã được thuê trong ${days} ngày.\n📆 Ngày bắt đầu: ${time_start}\n⏳ Ngày hết hạn: ${time_end}`, o.event.threadID);
        }
    }
};