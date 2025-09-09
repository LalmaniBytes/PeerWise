import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";

const useSocket = (threadId) => {
  const socket = useMemo(() => {
    if (!process.env.REACT_APP_SOCKET_URL) return null;

    return io(process.env.REACT_APP_SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      path: "/socket.io",
    });
  }, []);

  useEffect(() => {
    if (!socket || !threadId) return;

    socket.emit("join-thread", threadId);

    return () => {
      socket.emit("leave-thread", threadId);
    };
  }, [socket, threadId]);

  return socket;
};

export { useSocket };
