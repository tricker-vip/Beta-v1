this.config = {
    name: "vdgai",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "KyPhan",
    description: "vdgai",
    commandCategory: "General",
    usages: "vdgai",
    usePrefix: false,
    cooldowns: 5 
};
this.run = async ({ api, event }) => {
    api.sendMessage({
        body: `xin chào`,
        attachment: vdgai.splice(0, 1)}, event.threadID, event.messageID);
};