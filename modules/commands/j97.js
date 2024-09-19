module.exports.config = {
  name: "jack",
  version: "1.0.1",
  hasPermission: 0,
  credits: "KyPhan",
  description: "jack",
  commandCategory: "no prefix",
  usages: "",
  cooldowns: 0,
  dependencies: {
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.handleEvent = async ({ api, event, Threads }) => {
  const keywords = ["j97", "J97", "jack", "Jack", "đom đóm", "Đom đóm"];
  if (keywords.some(keyword => event.body.startsWith(keyword))) {
    const axios = global.nodemodule["axios"];
    const fs = global.nodemodule["fs-extra"];

    const messageID = event.messageID;
    if (!messageID) {
      console.error("Invalid messageID");
      return;
    }

    api.setMessageReaction("👀", messageID, () => {
      api.sendMessage("Chờ chút nhé...!", event.threadID, messageID);
    });

    const link = [
      "https://i.imgur.com/Hp0g2MU.mp4",
      "https://i.imgur.com/3CL770W.mp4",
      "https://i.imgur.com/2W7X66z.mp4",
      "https://i.imgur.com/mGJrUJv.mp4",
      "https://i.imgur.com/8gqyxST.mp4",
      "https://i.imgur.com/nzj8iXe.mp4",
      "https://i.imgur.com/8KdSYD9.mp4",
      "https://i.imgur.com/nduaeS9.mp4",
      "https://i.imgur.com/sxLKpEz.mp4",
      "https://i.imgur.com/mK7R8FT.mp4",
      "https://i.imgur.com/PrkDGpi.mp4"
    ];

    const videoLink = link[Math.floor(Math.random() * link.length)];
    const filePath = __dirname + "/cache/jack.mp4";

    try {
      const response = await axios({
        url: encodeURI(videoLink),
        method: 'GET',
        responseType: 'stream'
      });
      response.data.pipe(fs.createWriteStream(filePath)).on("finish", () => {
        api.sendMessage({ body: `5 củ`, attachment: fs.createReadStream(filePath) }, event.threadID, () => {
          fs.unlinkSync(filePath);
        }, messageID);
        api.setMessageReaction("✅", messageID);
      });
    } catch (error) {
      console.error("Error downloading or sending file:", error);
      api.sendMessage("Đã xảy ra lỗi khi xử lý yêu cầu của bạn.", event.threadID);
    }
  }
};

module.exports.run = async ({ api, event, args, Users, Threads, Currencies }) => {
};