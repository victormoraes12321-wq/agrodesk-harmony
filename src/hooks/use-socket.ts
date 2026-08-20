import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { soundEffects } from "@/lib/sound";
import { useApp } from "@/lib/store";

export function useSocketEvents() {
  const queryClient = useQueryClient();
  const { currentUser } = useApp();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!currentUser || typeof window === "undefined") return;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:3333"
        : `${window.location.protocol}//${window.location.hostname}:3333`);

    const socket = io(backendUrl, {
      query: { userId: currentUser.id },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Conexão estabelecida com sucesso
    });

    socket.on("ticket:created", (ticket: any) => {
      soundEffects.playNotification();
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      if (currentUser.role === "TI_ADMIN") {
        toast.info(`🔔 Nova OS Aberta: ${ticket.protocolNumber || "Sem protocolo"}`, {
          description: `${ticket.requesterName || "Solicitante"}: ${ticket.title || ticket.description?.slice(0, 40) || ""}`,
          duration: 5000,
        });
      }
    });

    socket.on("ticket:updated", (ticket: any) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      if (ticket?.id) {
        queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("ticket:comment", (comment: any) => {
      if (comment?.ticketId) {
        queryClient.invalidateQueries({ queryKey: ["comments", comment.ticketId] });
      }
      if (comment?.userId !== currentUser.id) {
        soundEffects.playNotification();
      }
    });

    socket.on("notification:new", (notification: any) => {
      soundEffects.playNotification();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (notification?.title) {
        toast(notification.title, {
          description: notification.message,
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser, queryClient]);

  return socketRef.current;
}
