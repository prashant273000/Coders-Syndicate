import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import {
  getUsers,
  getPrivateMessages,
  getWorldMessages,
  syncUser,
  markPrivateRead,
  getInbox,
  getOnlineUserIds,
} from "../services/chatService";
import styles from "./ChatPage.module.css";

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const userId = currentUser?.uid;

  const { socket, onlineUsers } = useSocket(userId);

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("world");
  const [peerId, setPeerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [seedOnline, setSeedOnline] = useState([]);

  const messagesEndRef = useRef(null);
  const seenIdsRef = useRef(new Set());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const onlineSet = useMemo(() => {
    const fromSocket = Array.isArray(onlineUsers) ? onlineUsers : [];
    const fromApi = Array.isArray(seedOnline) ? seedOnline : [];
    return new Set([...fromSocket, ...fromApi]);
  }, [onlineUsers, seedOnline]);

  const convMap = useMemo(() => {
    const m = new Map();
    if (Array.isArray(conversations)) {
      for (const c of conversations) {
        if (c?.peerId) m.set(c.peerId, c);
      }
    }
    return m;
  }, [conversations]);

  const refreshSidebar = useCallback(async () => {
    if (!userId) return;
    const u = await getUsers(userId);
    const conv = await getInbox(userId);
    const onlineIds = await getOnlineUserIds();
    setUsers(Array.isArray(u) ? u : []);
    setConversations(Array.isArray(conv) ? conv : []);
    setSeedOnline(Array.isArray(onlineIds) ? onlineIds : []);
  }, [userId]);

  useEffect(() => {
    if (!currentUser || !userId) return;
    syncUser({
      uid: userId,
      username: currentUser.displayName || currentUser.email || userId,
      email: currentUser.email || "",
      avatar: currentUser.photoURL || "",
    });
  }, [currentUser, userId]);

  useEffect(() => {
    refreshSidebar();
  }, [refreshSidebar]);

  const loadThread = useCallback(async () => {
    seenIdsRef.current = new Set();
    if (mode === "world") {
      const list = await getWorldMessages();
      const arr = Array.isArray(list) ? list : [];
      setMessages(arr);
      arr.forEach((m) => {
        if (m?._id) seenIdsRef.current.add(String(m._id));
      });
      return;
    }
    if (mode === "private" && peerId) {
      const list = await getPrivateMessages(userId, peerId);
      const arr = Array.isArray(list) ? list : [];
      setMessages(arr);
      arr.forEach((m) => {
        if (m?._id) seenIdsRef.current.add(String(m._id));
      });
      await markPrivateRead(userId, peerId);
      await refreshSidebar();
    }
  }, [mode, peerId, userId, refreshSidebar]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket) return undefined;

    const onPrivate = (msg) => {
      if (!msg || msg.type !== "private") return;
      const a = msg.senderId;
      const b = msg.receiverId;
      const inConv =
        mode === "private" &&
        peerId &&
        userId &&
        ((a === userId && b === peerId) || (a === peerId && b === userId));
      const id = msg._id ? String(msg._id) : null;
      if (inConv && id && !seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id);
        setMessages((prev) => [...(Array.isArray(prev) ? prev : []), msg]);
      }
      refreshSidebar();
    };

    const onWorld = (msg) => {
      if (!msg || msg.type !== "world") return;
      const id = msg._id ? String(msg._id) : null;
      if (mode === "world" && id && !seenIdsRef.current.has(id)) {
        seenIdsRef.current.add(id);
        setMessages((prev) => [...(Array.isArray(prev) ? prev : []), msg]);
      } else if (mode === "world" && !id) {
        setMessages((prev) => [...(Array.isArray(prev) ? prev : []), msg]);
      }
      refreshSidebar();
    };

    socket.on("privateMessage", onPrivate);
    socket.on("worldMessage", onWorld);
    return () => {
      socket.off("privateMessage", onPrivate);
      socket.off("worldMessage", onWorld);
    };
  }, [socket, mode, peerId, userId, refreshSidebar]);

  const selectWorld = () => {
    setMode("world");
    setPeerId(null);
  };

  const selectPeer = (pid) => {
    setMode("private");
    setPeerId(pid);
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !userId || !socket) return;
    if (mode === "world") {
      socket.emit("sendWorldMessage", { senderId: userId, content: text });
      setDraft("");
      return;
    }
    if (mode === "private" && peerId) {
      socket.emit("sendPrivateMessage", {
        senderId: userId,
        receiverId: peerId,
        content: text,
      });
      setDraft("");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, search]);

  const activePeer = useMemo(() => {
    if (!peerId || !Array.isArray(users)) return null;
    return users.find((u) => u.uid === peerId) || null;
  }, [peerId, users]);

  if (authLoading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (!currentUser) {
    return (
      <div className={styles.loading}>
        <div className={styles.signInBox}>
          <p style={{ marginBottom: 16 }}>Sign in to use chat.</p>
          <Link to="/login">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div style={{ padding: "12px 20px" }}>
        <Link to="/" className={styles.backLink}>
          ← Home
        </Link>
      </div>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.search}>
            <input
              className={styles.searchInput}
              placeholder="Search players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={`${styles.worldBtn} ${mode === "world" ? styles.worldBtnActive : ""}`}
            onClick={selectWorld}
          >
            🌍 World Chat
          </button>
          <div className={styles.userList}>
            {Array.isArray(filteredUsers) &&
              filteredUsers.map((u) => {
                const conv = convMap.get(u.uid);
                const preview = conv?.lastMessage?.content || "No messages yet";
                const unread = conv?.unreadCount || 0;
                const isOn = onlineSet.has(u.uid);
                const active = mode === "private" && peerId === u.uid;
                return (
                  <div
                    key={u.uid}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectPeer(u.uid)}
                    onKeyDown={(e) => e.key === "Enter" && selectPeer(u.uid)}
                    className={`${styles.userRow} ${active ? styles.userRowActive : ""}`}
                  >
                    <div className={styles.avatarWrap}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className={styles.avatar} />
                      ) : (
                        <div
                          className={styles.avatar}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            color: "#bf5fff",
                          }}
                        >
                          {(u.username || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`${styles.onlineDot} ${!isOn ? styles.offlineDot : ""}`} />
                    </div>
                    <div className={styles.userMeta}>
                      <div className={styles.userName}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{u.username}</span>
                        {unread > 0 ? <span className={styles.badge}>{unread > 99 ? "99+" : unread}</span> : null}
                      </div>
                      <div className={styles.preview}>{preview}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topBar}>
            {mode === "world" ? (
              <>
                <span style={{ fontSize: "1.5rem" }}>🌍</span>
                <span className={styles.topTitle}>World Chat</span>
              </>
            ) : activePeer ? (
              <>
                {activePeer.avatar ? (
                  <img src={activePeer.avatar} alt="" className={styles.avatar} style={{ width: 36, height: 36 }} />
                ) : (
                  <div
                    className={styles.avatar}
                    style={{
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "#39ff14",
                    }}
                  >
                    {activePeer.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className={styles.topTitle}>{activePeer.username}</div>
                  <div style={{ fontSize: "0.7rem", color: onlineSet.has(peerId) ? "#39ff14" : "#666" }}>
                    {onlineSet.has(peerId) ? "● Online" : "○ Offline"}
                  </div>
                </div>
              </>
            ) : (
              <span className={styles.topTitle}>Select a player</span>
            )}
          </header>

          <div className={styles.messages}>
            {(!Array.isArray(messages) || messages.length === 0) && (
              <div className={styles.empty}>No messages yet</div>
            )}
            {Array.isArray(messages) &&
              messages.map((m) => {
                const mine = m.senderId === userId;
                if (mode === "world") {
                  const wMine = m.senderId === userId;
                  return (
                    <div
                      key={String(m._id || `${m.createdAt}-${m.senderId}`)}
                      className={`${styles.row} ${wMine ? styles.rowMine : styles.rowTheirs}`}
                    >
                      <div
                        className={styles.worldSender}
                        style={wMine ? { color: "#bf5fff", textAlign: "right", width: "100%" } : {}}
                      >
                        {wMine ? "You" : (m.senderUsername || m.senderId || "?").toString()}
                      </div>
                      <div className={wMine ? styles.bubbleMine : styles.bubbleTheirs}>{m.content}</div>
                      <div className={styles.time}>{formatTime(m.createdAt)}</div>
                    </div>
                  );
                }
                return (
                  <div
                    key={String(m._id || `${m.createdAt}-${m.senderId}`)}
                    className={`${styles.row} ${mine ? styles.rowMine : styles.rowTheirs}`}
                  >
                    <div className={mine ? styles.bubbleMine : styles.bubbleTheirs}>{m.content}</div>
                    <div className={styles.time}>{formatTime(m.createdAt)}</div>
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputBar}>
            <input
              className={styles.textInput}
              placeholder={
                mode === "world"
                  ? "Message the realm…"
                  : peerId
                    ? "Type a message…"
                    : "Pick someone to chat"
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={mode === "private" && !peerId}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={send}
              disabled={!socket || (mode === "private" && !peerId)}
            >
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
