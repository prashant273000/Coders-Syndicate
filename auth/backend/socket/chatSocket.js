const Message = require("../models/message");
const User = require("../models/user");
const online = require("../lib/onlineUsers");

const MAX_LEN = 5000;

module.exports = function attachChatSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      try {
        if (!userId || typeof userId !== "string") return;
        socket.data.userId = userId;
        online.registerUser(userId, socket.id);
        io.emit("onlineUsers", online.getOnlineUserIds());
      } catch (e) {
        console.error("socket join", e);
      }
    });

    socket.on("sendPrivateMessage", async (payload) => {
      try {
        const { senderId, receiverId, content } = payload || {};
        if (!senderId || !receiverId || content == null) return;
        const text = String(content).slice(0, MAX_LEN);
        if (!text.trim()) return;

        const doc = await Message.create({
          senderId,
          receiverId,
          content: text,
          type: "private",
          read: false,
        });

        const plain = doc.toObject();
        const receiverSocket = online.getSocketId(receiverId);
        const senderSocket = online.getSocketId(senderId);

        if (receiverSocket) {
          io.to(receiverSocket).emit("privateMessage", plain);
        }
        if (senderSocket) {
          io.to(senderSocket).emit("privateMessage", plain);
        }
      } catch (e) {
        console.error("sendPrivateMessage", e);
      }
    });

    socket.on("sendWorldMessage", async (payload) => {
      try {
        const { senderId, content } = payload || {};
        if (!senderId || content == null) return;
        const text = String(content).slice(0, MAX_LEN);
        if (!text.trim()) return;

        const user = await User.findOne({ uid: senderId }).select("username avatar").lean();
        const doc = await Message.create({
          senderId,
          receiverId: null,
          content: text,
          type: "world",
          read: false,
        });

        const plain = doc.toObject();
        const enriched = {
          ...plain,
          senderUsername: user?.username || senderId.slice(0, 8),
          senderAvatar: user?.avatar || "",
        };

        io.emit("worldMessage", enriched);
      } catch (e) {
        console.error("sendWorldMessage", e);
      }
    });

    socket.on("disconnect", () => {
      try {
        online.removeSocket(socket.id);
        io.emit("onlineUsers", online.getOnlineUserIds());
      } catch (e) {
        console.error("socket disconnect", e);
      }
    });
  });
};
