const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Hàm kiểm tra xem chuỗi có chứa URL hợp lệ không
const isURL = (u) => /\bhttps?:\/\/[^\s]+/g.test(u);

exports.handleEvent = async function (o) {
    try {
        const str = o.event.body; // Lấy nội dung từ tin nhắn
        
        // Kiểm tra nếu `str` không tồn tại hoặc không có giá trị
        if (!str) {
            console.error('No message body found');
            return;
        }

        const send = (msg) => o.api.sendMessage(msg, o.event.threadID, o.event.messageID); // Hàm gửi tin nhắn
        const head = (app) => `[ AUTODOWN - ${app.toUpperCase()} ]\n──────────────────`; // Định dạng tiêu đề

        // Trích xuất URL từ chuỗi văn bản
        const urlMatches = str.match(/\bhttps?:\/\/[^\s]+/g); // Tìm tất cả các URL trong văn bản
        if (!urlMatches) return; // Nếu không có URL hợp lệ thì kết thúc

        const url = urlMatches[0]; // Lấy URL đầu tiên (nếu có nhiều link)

        // Kiểm tra từng nền tảng dựa vào URL đã trích xuất
        if (/(^https:\/\/)((vm|vt|www|v)\.)?(tiktok|douyin)\.com\//.test(url)) {
            const json = await infoPostTT(url);
            let attachment = [];
            if (json.images) {
                for (const $ of json.images) {
                    attachment.push(await streamUrl($, 'png'));
                }
            } else {
                attachment = await streamUrl(json.play, 'mp4');
            }
            o.api.sendMessage({
                body: `${head('TIKTOK')}\n⩺ Tên kênh: ${json.author.nickname}\n⩺ Id người dùng: ${json.author.unique_id}\n⩺ Quốc gia: ${json.region}\n⩺ Tiêu đề: ${json.title}\n⩺ Tim: ${json.digg_count}\n⩺ Lượt xem: ${json.play_count}\n⩺ Bình luận: ${json.comment_count}\n⩺ Chia sẽ: ${json.share_count}\n⩺ Thời gian: ${convertHMS(json.duration)}\n⩺ Lượt tải: ${json.download_count}\n⩺ Thả cx'😆'để tải mp3`,
                attachment
            }, o.event.threadID, (error, info) => {
                global.client.handleReaction.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: o.event.senderID,
                    data: json
                });
            }, o.event.messageID);

            console.log(`Tải TikTok từ ${url} thành công`);
        } else if (/facebook\.com|fb\.watch/.test(str)) {
            try {
                const res = (await axios.get(`http://dongdev.click/api/down/media?url=${encodeURIComponent(url)}`)).data;
                let attachment = [];
                if (res.attachments && res.attachments.length > 0) {
                    for (const attachmentItem of res.attachments) {
                        if (attachmentItem.type === 'Video') {
                            const videoUrl = attachmentItem.url.sd || attachmentItem.url.hd;
                            attachment.push(await streamUrl(videoUrl, 'mp4'));
                        } else if (attachmentItem.type === 'Photo') {
                            attachment.push(await streamUrl(attachmentItem.url, 'jpg'));
                        }
                    }
                    send({
                        body: `${head('FACEBOOK')}\n⩺ Tiêu đề: ${res.message || "null"}\n${res.like ? `⩺ Lượt thích: ${res.like}\n` : ''}${res.comment ? `⩺ Bình luận: ${res.comment}\n` : ''}${res.share ? `⩺ Chia sẻ: ${res.share}\n` : ''}⩺ Tác giả: ${res.author || "unknown"}`,
                        attachment
                    });

                    console.log(`Tải Facebook từ ${url} thành công`);
                }
            } catch (error) {
                console.error('Error fetching media:', error);
                send({ body: 'Đã xảy ra lỗi khi lấy dữ liệu.' });
            }
        } else if (/(^https:\/\/)((www)\.)?(youtube|youtu)(PP)*\.(com|be)\//.test(url)) {
            let ytdl = require('@distube/ytdl-core');
            ytdl.getInfo(url).then(async info => {
                let detail = info.videoDetails;
                let format = info.formats.find(f => f.qualityLabel && f.qualityLabel.includes('360p') && f.audioBitrate);
                if (format) {
                    send({
                        body: `${head('YOUTUBE')}\n⩺ Tiêu Đề: ${detail.title}\n⩺ Thời lượng: ${convertHMS(Number(detail.lengthSeconds))}`,
                        attachment: await streamUrl(format.url, 'mp4')
                    });

                    console.log(`Tải YouTube từ ${url} thành công`);
                } else {
                    console.error('Không tìm thấy định dạng phù hợp!');
                }
            });
        } else if (/https:\/\/www\.capcut\.com\/(t\/[A-Za-z0-9]+|[\w\d\/]+)/.test(url)) {
            try {
                const data = await capcutDl(url);
                send({
                    body: `${head('CapCut')}\n⩺ Tiêu Đề: ${data.title}\n⩺ Mô Tả: ${data.description}\n⩺ Lượt Dùng: ${data.usage}`,
                    attachment: await streamUrl(data.video, 'mp4')
                });

                console.log(`Tải CapCut từ ${url} thành công`);
            } catch (error) {
                console.error('Error handling CapCut event:', error.message);
            }
        } else if (/soundcloud\.com\//.test(url)) {
            try {
                const res = await getData(url);
                let attachment = await streamUrl(res.url, 'mp3');
                send({
                    body: `${head('SOUNDCLOUD')}\n⩺ Tiêu đề: ${res.title}\n⩺ Tác giả: ${res.author}`,
                    attachment
                });

                console.log(`Tải SoundCloud từ ${url} thành công`);
            } catch (error) {
                console.error('Error handling SoundCloud event:', error.message);
            }
        } else if (/instagram\.com\/(stories|p|reel|tv)\//.test(url)) {
            const res = (await axios.get(`http://dongdev.click/api/down/media?url=${url}`)).data;
            let attachment = [];
            if (res.attachments && res.attachments.length > 0) {
                for (const at of res.attachments) {
                    if (at.type === 'Video') {
                        attachment.push(await streamUrl(at.url, 'mp4'));
                    } else if (at.type === 'Photo') {
                        attachment.push(await streamUrl(at.url, 'jpg'));
                    }
                }
                send({
                    body: `${head('INSTAGRAM')}\n⩺ Tiêu đề: ${res.message}\n⩺ Tác giả: ${res.author}\n⩺ Lượt thích: ${res.like}\n⩺ Bình luận: ${res.comment}`,
                    attachment
                });

                console.log(`Tải Instagram từ ${url} thành công`);
            }
        }
    } catch (e) {
        console.error('Error occurred:', e.message, e.stack);
    }
};


exports.run = () => {};

exports.handleReaction = async function (o) {
    const { threadID: t, messageID: m, reaction: r } = o.event;
    const { handleReaction: _ } = o;
    if (r != "😆") return;

    o.api.sendMessage({
        body: `[ MP3 - TIKTOK ]\n⩺ ID: ${_.data.music_info.id}\n⩺ Tiêu đề: ${_.data.music_info.title}\n⩺ Thời gian: ${convertHMS(_.data.music_info.duration)}`,
        attachment: await streamUrl(_.data.music, "mp3")
    }, t, m);
};

exports.config = {
    name: 'autodown',
    version: '1.1.1',
    hasPermssion: 0,
    credits: 'KyPhan',
    description: 'Tự động tải, Facebook, TikTok, CapCut, YouTube, SoundCloud, Instagram',
    commandCategory: 'Tiện ích',
    usages: [],
    cooldowns: 3
};

// Các hàm phụ trợ

async function streamUrl(url, type) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const filePath = path.join(__dirname, 'cache', `${Date.now()}.${type}`);
        fs.writeFileSync(filePath, res.data);
        return fs.createReadStream(filePath);
    } catch (error) {
        console.error(`Error streaming URL (${url}):`, error.message);
        return null;
    }
}

// Hàm lấy thông tin video TikTok
async function infoPostTT(url) {
    try {
        const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        if (res.data && res.data.data) {
            return res.data.data;
        }
        throw new Error('Không thể lấy thông tin TikTok');
    } catch (error) {
        console.error('Error fetching TikTok info:', error.message);
        throw error;
    }
}

// Hàm lấy thông tin CapCut
async function capcutDl(url) {
    try {
        if (!url) throw new Error('Thiếu dữ liệu để khởi chạy chương trình');

        // Step 1: Get the download URL
        const getUrlResponse = await axios.get(`https://ssscap.net/api/download/get-url?url=${url}`);
        const downloadUrl = getUrlResponse.data.url;

        // Extract the URL segment needed for the second request
        const urlSegment = downloadUrl.split("/")[4].split("?")[0];

        // Step 2: Get the CapCut data
        const options = {
            method: 'GET',
            url: `https://ssscap.net/api/download/${urlSegment}`,
            headers: {
                'Connection': 'keep-alive',
                'If-None-Match': 'W/"b5g46esu4owe"',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
                'Cookie': 'device-time=1689832206038; sign=35455ecfd6b5b5e1cc76167c3efb033a; __gads=ID=213a51ccbc3e8cae-2232104a6ee20085:T=1689832121:RT=1689832121:S=ALNI_MaUG-o0pLuBRphxaRt_Q-pvbaFehg; __gpi=UID=00000c227e4bec29:T=1689832121:RT=1689832121:S=ALNI_Majvgt2Z1isgWbx_YqPFXcuzjYtww',
                'Referer': 'https://ssscap.net/vi',
                'Host': 'ssscap.net',
                'Accept-Language': 'vi-VN,vi;q=0.9',
                'Accept': 'application/json, text/plain, */*',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors'
            }
        };

        const response = await axios.request(options);
        const data = response.data;

        // Return the extracted data
        return {
            title: data.title,
            video: `https://ssscap.net${data.originalVideoUrl}`,
            description: data.description,
            usage: data.usage
        };

    } catch (error) {
        console.error('Error fetching CapCut data:', error.message);
        throw error;
    }
}

async function getData(url) {
    try {
        const { data } = await axios({
            method: 'post',
            url: 'https://api.downloadsound.cloud/track',
            headers: { 
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'vi,en;q=0.9',
                'Content-Type': 'application/json;charset=UTF-8',
                'Origin': 'https://downloadsound.cloud',
                'Priority': 'u=1, i',
                'Referer': 'https://downloadsound.cloud/',
                'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
            },
            data: {
                "url": url
            }
        });

        if (!data || !data.title || !data.author || !data.url) {
            throw new Error('Invalid response format');
        }

        return {
            title: data.title,
            author: data.author.username,
            url: data.url
        };
    } catch (error) {
        console.error('Error fetching SoundCloud data:', error.message);
        throw error;
    }
}

// Hàm chuyển đổi giây thành định dạng HH:MM:SS
function convertHMS(value) {
    const sec = parseInt(value, 10); // chuyển đổi sang số nguyên
    let hours = Math.floor(sec / 3600); // tính giờ
    let minutes = Math.floor((sec - (hours * 3600)) / 60); // tính phút
    let seconds = sec - (hours * 3600) - (minutes * 60); // tính giây
    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return hours + ':' + minutes + ':' + seconds; // trả về định dạng HH:MM:SS
}
