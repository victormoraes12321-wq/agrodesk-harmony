import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit(server: Server) {
    this.logger.log("⚡ EventsGateway WebSocket initialized");
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string | undefined;
    if (userId) {
      client.join(`user:${userId}`);
    }
    this.logger.debug(`Client connected: ${client.id} (user: ${userId || "guest"})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitTicketCreated(ticket: any) {
    this.server?.emit("ticket:created", ticket);
  }

  emitTicketUpdated(ticket: any) {
    this.server?.emit("ticket:updated", ticket);
  }

  emitTicketComment(comment: any) {
    this.server?.emit("ticket:comment", comment);
  }

  emitNotification(userId: string, notification: any) {
    this.server?.to(`user:${userId}`).emit("notification:new", notification);
    this.server?.emit("notification:broadcast", notification);
  }
}
