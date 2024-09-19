module.exports.config = {
  name: "out",
  version: "1.0.4",
  hasPermission: 3,
  credits: "KyPhan",
  description: "Liệt kê danh sách nhóm và rời nhóm theo lựa chọn",
  commandCategory: "Admin",
  usages: "out [list|all|ID nhóm] [Lý do]",
  cooldowns: 5,
  dependencies: "",
};

module.exports.run = async function ({ api, event, args }) {
  const reason = args.slice(1).join(" ") || "Không có lý do."; // Lý do mặc định

  try {
    if (args[0] === "all") {
      // Rời tất cả các nhóm
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = allThreads.filter(thread => thread.isGroup);

      for (const thread of groupThreads) {
        const idbox = thread.threadID;

        // Thông báo trước khi rời nhóm
        await api.sendMessage(
          `✅ Đã nhận lệnh rời nhóm từ Admin, lý do: ${reason}`,
          idbox
        );

        // Xóa dữ liệu nhóm (nếu API hỗ trợ)
        if (api.deleteGroupData) {
          await api.deleteGroupData(idbox);
        }

        // Rời nhóm
        await api.removeUserFromGroup(api.getCurrentUserID(), idbox);
      }

      api.sendMessage(`✅ Đã rời tất cả các nhóm với lý do: ${reason}`, event.threadID);
    } else if (args[0] === "list") {
      // Hiển thị danh sách tất cả các nhóm
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      const groupThreads = allThreads.filter(thread => thread.isGroup);

      let listMsg = "🔰 Danh sách các nhóm bot đang tham gia:\n";
      let index = 1;
      let threadIDs = {};

      groupThreads.forEach(thread => {
        listMsg += `${index}. ${thread.name || "Không tên"} (ID: ${thread.threadID})\n`;
        threadIDs[index] = thread.threadID;
        index++;
      });

      listMsg += "\nNhập số thứ tự (stt) để chọn nhóm muốn rời.";

      api.sendMessage(listMsg, event.threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          threadIDs: threadIDs,
          reason: reason
        });
      });
    } else {
      // Rời nhóm theo ID đã cho
      let idbox;
      if (args.length > 0 && !isNaN(args[0])) {
        idbox = args[0];
      } else {
        idbox = event.threadID; // Sử dụng ID nhóm hiện tại nếu không cung cấp ID
      }

      // Thông báo trước khi rời nhóm
      await api.sendMessage(
        `✅ Đã nhận lệnh rời nhóm từ Admin, lý do: ${reason}`,
        idbox
      );

      // Xóa dữ liệu nhóm nếu API hỗ trợ
      if (api.deleteGroupData) {
        await api.deleteGroupData(idbox);
      }

      // Rời nhóm
      await api.removeUserFromGroup(api.getCurrentUserID(), idbox);
      api.sendMessage(`✅ Đã rời nhóm có ID: ${idbox} với lý do: ${reason}`, event.threadID);
    }
  } catch (error) {
    api.sendMessage(`⛔ Đã xảy ra lỗi: ${error.message}`, event.threadID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  try {
    if (event.senderID !== handleReply.author) return;

    const index = parseInt(event.body);
    const idbox = handleReply.threadIDs[index];

    if (!idbox) return api.sendMessage("⛔ Số thứ tự không hợp lệ!", event.threadID);

    // Thông báo trước khi rời nhóm
    await api.sendMessage(
      `✅ Đã nhận lệnh rời nhóm từ Admin, lý do: ${handleReply.reason}`,
      idbox
    );

    // Xóa dữ liệu nhóm nếu API hỗ trợ
    if (api.deleteGroupData) {
      await api.deleteGroupData(idbox);
    }

    // Rời nhóm
    await api.removeUserFromGroup(api.getCurrentUserID(), idbox);
    api.sendMessage(`✅ Đã rời nhóm có ID: ${idbox} với lý do: ${handleReply.reason}`, event.threadID);
  } catch (error) {
    api.sendMessage(`⛔ Đã xảy ra lỗi: ${error.message}`, event.threadID);
  }
};