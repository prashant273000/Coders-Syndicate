const express = require("express");
const User = require("../models/user");
const Message = require("../models/message");
const { getOnlineUserIds } = require("../lib/onlineUsers");

const router = express.Router();

router.get("/users", async (req, res) => {
  try {
    const excludeUserId = req.query.excludeUserId;
    const q = excludeUserId ? { uid: { $ne: excludeUserId } } : {};
    const users = await User.find(q).select("uid username email avatar").lean();
    const list = Array.isArray(users) ? users : [];
    const mapped = list.map((u) => ({
      uid: u.uid,
      username: u.username || u.email || u.uid,
      email: u.email || "",
      avatar: u.avatar || "",
    }));
    return res.json({ ok: true, users: mapped });
  } catch (err) {
    console.error("chat/users", err);
    return res.json({ ok: true, users: [] });
  }
});

router.get("/private", async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;
    if (!senderId || !receiverId) {
      return res.json({ ok: true, messages: [] });
    }
    const raw = await Message.find({
      type: "private",
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const arr = Array.isArray(raw) ? raw : [];
    const messages = [...arr].reverse();
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error("chat/private", err);
    return res.json({ ok: true, messages: [] });
  }
});

router.post("/private/mark-read", async (req, res) => {
  try {
    const { readerId, partnerId } = req.body || {};
    if (!readerId || !partnerId) {
      return res.json({ ok: false, error: "readerId and partnerId required" });
    }
    await Message.updateMany(
      {
        type: "private",
        senderId: partnerId,
        receiverId: readerId,
        read: false,
      },
      { $set: { read: true } }
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("chat/private/mark-read", err);
    return res.json({ ok: false, error: err.message });
  }
});

router.get("/world", async (req, res) => {
  try {
    const raw = await Message.find({ type: "world" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const arr = Array.isArray(raw) ? raw : [];
    const asc = [...arr].reverse();
    const uids = [...new Set(asc.map((m) => m.senderId).filter(Boolean))];
    const senders = await User.find({ uid: { $in: uids } }).select("uid username avatar").lean();
    const senderList = Array.isArray(senders) ? senders : [];
    const byUid = Object.fromEntries(senderList.map((u) => [u.uid, u]));

    const messages = asc.map((m) => {
      const s = byUid[m.senderId];
      return {
        ...m,
        senderUsername: s?.username || m.senderId?.slice(0, 8) || "?",
        senderAvatar: s?.avatar || "",
      };
    });

    return res.json({ ok: true, messages });
  } catch (err) {
    console.error("chat/world", err);
    return res.json({ ok: true, messages: [] });
  }
});

router.post("/user/sync", async (req, res) => {
  try {
    const { uid, username, email, avatar } = req.body || {};
    if (!uid) {
      return res.status(400).json({ ok: false, error: "uid required" });
    }

    const uname = username || email || uid;
    const av = avatar || "";
    await User.findOneAndUpdate(
      { uid },
      {
        $set: {
          uid,
          username: uname,
          email: email || "",
          avatar: av,
          name: uname,
          picture: av,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("chat/user/sync", err);
    return res.status(500).json({ ok: false, error: err.message || "error" });
  }
});

router.get("/online", async (req, res) => {
  try {
    const userIds = getOnlineUserIds();
    return res.json({ ok: true, userIds: Array.isArray(userIds) ? userIds : [] });
  } catch (err) {
    console.error("chat/online", err);
    return res.json({ ok: true, userIds: [] });
  }
});

/** Sidebar: last message + unread count per peer */
router.get("/inbox", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.json({ ok: true, conversations: [] });

    const all = await Message.find({
      type: "private",
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(800)
      .lean();

    const lastByPeer = new Map();
    if (Array.isArray(all)) {
      for (const m of all) {
        const peer = m.senderId === userId ? m.receiverId : m.senderId;
        if (peer && !lastByPeer.has(peer)) lastByPeer.set(peer, m);
      }
    }

    let unreadAgg = [];
    try {
      unreadAgg = await Message.aggregate([
        { $match: { type: "private", receiverId: userId, read: false } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
      ]);
    } catch (aggErr) {
      console.error("chat/inbox aggregate", aggErr);
    }

    const unreadMap = {};
    if (Array.isArray(unreadAgg)) {
      for (const row of unreadAgg) {
        if (row && row._id) unreadMap[row._id] = row.count;
      }
    }

    const conversations = [];
    for (const [peerId, lastMessage] of lastByPeer.entries()) {
      conversations.push({
        peerId,
        lastMessage,
        unreadCount: unreadMap[peerId] || 0,
      });
    }

    return res.json({ ok: true, conversations });
  } catch (err) {
    console.error("chat/inbox", err);
    return res.json({ ok: true, conversations: [] });
  }
});

module.exports = router;
