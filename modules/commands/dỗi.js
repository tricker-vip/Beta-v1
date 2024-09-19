const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "dỗi",
    version: "1.0.0",
    hasPermission: 1,
    credits: "KyPhan",
    description: "Dỗi người được tag",
    commandCategory: "Nhóm",
    usages: "<tag người>",
    cooldowns: 5
};

// Định nghĩa URL ảnh và đường dẫn cache
const imageUrl = "https://i.imgur.com/4a8ZzfO.jpeg";
const cacheFilePath = path.join(__dirname, 'cache/cached_image.jpeg');

module.exports.run = async function({ api, event, args }) {
    const { mentions } = event;
    if (Object.keys(mentions).length === 0) {
        return api.sendMessage("Bạn cần tag một người để dỗi.", event.threadID, event.messageID);
    }

    // Lấy tên đầy đủ của người bị tag và loại bỏ ký tự "@"
    const taggedUser = Object.values(mentions)[0];
    const fullName = taggedUser.replace('@', ''); // Loại bỏ ký tự "@"

    // Tạo tin nhắn dỗi
    const message = `Dỗi ${fullName} rồi!`;

    try {
        // Kiểm tra xem ảnh đã được lưu trữ chưa
        if (!fs.existsSync(cacheFilePath)) {
            // Tải ảnh về nếu không có trong cache
            console.log("Downloading image to cache...");
            const response = await axios({
                url: imageUrl,
                responseType: 'stream'
            });
            response.data.pipe(fs.createWriteStream(cacheFilePath));

            // Đợi đến khi ảnh được tải về hoàn tất
            await new Promise((resolve, reject) => {
                response.data.on('end', resolve);
                response.data.on('error', reject);
            });
        }

        // Gửi tin nhắn với ảnh từ cache
        await api.sendMessage({
            body: message,
            attachment: fs.createReadStream(cacheFilePath)
        }, event.threadID, event.messageID);

    } catch (error) {
        console.error("An error occurred:", error);
        return api.sendMessage("Đã xảy ra lỗi khi gửi tin nhắn.", event.threadID, event.messageID);
    } finally {
        // Xóa ảnh tạm sau khi gửi xong
        if (fs.existsSync(cacheFilePath)) {
            fs.unlinkSync(cacheFilePath);
        }
    }
};