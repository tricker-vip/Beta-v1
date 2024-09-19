module.exports.config = {
	name: "tid",
	version: "1.0.0", 
	hasPermssion: 0,
	credits: "KyPhan",
	description: "Lấy ID box", 
	commandCategory: "Tiện ích",
	usages: "tid",
	cooldowns: 5, 
};

module.exports.run = async function({ api, event, args }) {
    // Kiểm tra xem tin nhắn có được gửi trong một nhóm không
    if (event.threadID) {
        // Gửi ID của nhóm cho người dùng
        api.sendMessage(`${event.threadID}`, event.threadID);
    } else {
        // Nếu không phải trong nhóm, thông báo cho người dùng rằng lệnh này chỉ hoạt động trong nhóm
        api.sendMessage("Lệnh này chỉ có thể sử dụng trong nhóm.", event.threadID);
    }
};