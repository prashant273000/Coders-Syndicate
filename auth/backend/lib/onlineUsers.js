/** Firebase UID → socket id (last connection wins). */
const userIdToSocketId = new Map();

function registerUser(userId, socketId) {
  if (!userId || !socketId) return;
  userIdToSocketId.set(userId, socketId);
}

function removeSocket(socketId) {
  if (!socketId) return;
  for (const [uid, sid] of userIdToSocketId.entries()) {
    if (sid === socketId) {
      userIdToSocketId.delete(uid);
      return;
    }
  }
}

function getSocketId(userId) {
  return userIdToSocketId.get(userId);
}

function getOnlineUserIds() {
  return Array.from(userIdToSocketId.keys());
}

module.exports = {
  registerUser,
  removeSocket,
  getSocketId,
  getOnlineUserIds,
};
