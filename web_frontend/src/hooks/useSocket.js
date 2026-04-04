import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_ORIGIN } from "../constants/api";

/**
 * @param {string | undefined} userId Firebase UID
 * @returns {{ socket: import("socket.io-client").Socket | null, onlineUsers: string[] }}
 */
export function useSocket(userId) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      setOnlineUsers([]);
      return undefined;
    }

    const s = io(API_ORIGIN, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    const onConnect = () => {
      s.emit("join", userId);
    };

    const onOnlineUsers = (ids) => {
      if (Array.isArray(ids)) setOnlineUsers(ids);
      else setOnlineUsers([]);
    };

    s.on("connect", onConnect);
    s.on("onlineUsers", onOnlineUsers);
    setSocket(s);

    if (s.connected) {
      onConnect();
    }

    return () => {
      s.off("connect", onConnect);
      s.off("onlineUsers", onOnlineUsers);
      s.disconnect();
      setSocket(null);
      setOnlineUsers([]);
    };
  }, [userId]);

  return { socket, onlineUsers };
}
