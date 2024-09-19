this.config = {
    name: "vdcos",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "KyPhan",
    description: "cos",
    commandCategory: "General",
    usages: "cos",
    usePrefix: false,
    cooldowns: 5
};
this.run = async ({ api, event }) => {
    api.sendMessage({
        body: `xin chào`,
        attachment: cos.splice(0, 1)}, event.threadID, event.messageID);
};