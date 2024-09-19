this.config = {
    name: "vdtrai",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "KyPhan",
    description: "vdtrai",
    commandCategory: "General",
    usages: "vdtrai",
    usePrefix: false,
    cooldowns: 5 
};
this.run = async ({ api, event }) => {
    api.sendMessage({
        body: `xin chào`,
        attachment: vdtrai.splice(0, 1)}, event.threadID, event.messageID);
};