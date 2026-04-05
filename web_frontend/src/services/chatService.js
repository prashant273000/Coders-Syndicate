import { CHAT_API } from "../constants/api";

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getUsers(excludeUserId) {
  try {
    const q = new URLSearchParams({ excludeUserId: excludeUserId || "" });
    const res = await fetch(`${CHAT_API}/users?${q}`);
    const data = await parseJson(res);
    const users = data.users;
    return Array.isArray(users) ? users : [];
  } catch (e) {
    console.error("getUsers", e);
    return [];
  }
}

export async function getPrivateMessages(senderId, receiverId) {
  try {
    const q = new URLSearchParams({ senderId, receiverId });
    const res = await fetch(`${CHAT_API}/private?${q}`);
    const data = await parseJson(res);
    const messages = data.messages;
    return Array.isArray(messages) ? messages : [];
  } catch (e) {
    console.error("getPrivateMessages", e);
    return [];
  }
}

export async function getWorldMessages() {
  try {
    const res = await fetch(`${CHAT_API}/world`);
    const data = await parseJson(res);
    const messages = data.messages;
    return Array.isArray(messages) ? messages : [];
  } catch (e) {
    console.error("getWorldMessages", e);
    return [];
  }
}

export async function syncUser({ uid, username, email, avatar }) {
  try {
    const res = await fetch(`${CHAT_API}/user/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, username, email, avatar }),
    });
    return await parseJson(res);
  } catch (e) {
    console.error("syncUser", e);
    return { ok: false, error: String(e.message || e) };
  }
}

export async function getOnlineUserIds() {
  try {
    const res = await fetch(`${CHAT_API}/online`);
    const data = await parseJson(res);
    const userIds = data.userIds;
    return Array.isArray(userIds) ? userIds : [];
  } catch (e) {
    console.error("getOnlineUserIds", e);
    return [];
  }
}

export async function markPrivateRead(readerId, partnerId) {
  try {
    const res = await fetch(`${CHAT_API}/private/mark-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readerId, partnerId }),
    });
    return await parseJson(res);
  } catch (e) {
    console.error("markPrivateRead", e);
    return { ok: false };
  }
}

export async function getInbox(userId) {
  try {
    const q = new URLSearchParams({ userId: userId || "" });
    const res = await fetch(`${CHAT_API}/inbox?${q}`);
    const data = await parseJson(res);
    const conversations = data.conversations;
    return Array.isArray(conversations) ? conversations : [];
  } catch (e) {
    console.error("getInbox", e);
    return [];
  }
}
