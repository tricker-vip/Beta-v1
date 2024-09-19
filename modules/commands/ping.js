module.exports.config = {
	name: "ping",
	version: "1.0.5",
	hasPermssion: 1,
	credits: "Mirai Team",
	description: "Tag toàn bộ thành viên kèm theo tin nhắn",
	commandCategory: "Nhóm",
	usages: "[Nội dung tin nhắn]",
	cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
	try {
		const botID = await api.getCurrentUserID();
		let listAFK = [];
		let listUserID = event.participantIDs.filter(ID => ID != botID && ID != event.senderID);

		if (global.moduleData["afk"] && global.moduleData["afk"].afkList) {
			listAFK = Object.keys(global.moduleData["afk"].afkList);
		}

		listUserID = listUserID.filter(ID => !listAFK.includes(ID));

		let body = args.length ? args.join(" ") : "@mọi người";
		let mentions = [];
		let index = body.length;

		for (const idUser of listUserID) {
			mentions.push({ id: idUser, tag: "@mọi người", fromIndex: index });
			index += "@mọi người".length + 1; // Cộng thêm khoảng trắng
		}

		await api.sendMessage({ body, mentions }, event.threadID, event.messageID);
	}
	catch (e) {
		api.sendMessage(`Đã có lỗi xảy ra: ${e.message}`, event.threadID, event.messageID);
		console.log(e);
	}
};