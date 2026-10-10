import { WebSocket, WebSocketServer, type ServerOptions } from 'ws';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { WsMessageSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

interface User {
  ws: WebSocket,
  rooms: string[],
  userId: string
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch(e) {
    return null;
  }
}

// Takes the ws options rather than opening its own port, so this can either
// listen on a port of its own (standalone, below) or ride on an HTTP server
// that already exists (http-backend, when both are deployed as one service).
export function createWebSocketServer(options: ServerOptions) {
  // A single client could otherwise send a multi-megabyte "shape" that gets
  // stored, broadcast to the room, and replayed on every future load.
  const wss = new WebSocketServer({ maxPayload: 64 * 1024, ...options });

  wss.on('connection', function connection(ws, request) {
    const url = request.url;
    if (!url) {
      return;
    }
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || "";
    const userId = checkUser(token);

    if (userId == null) {
      ws.close()
      return;
    }

    users.push({
      userId,
      rooms: [],
      ws
    })

    // Without this the array grows for the life of the process and every
    // broadcast writes to sockets that are already gone.
    ws.on('close', function close() {
      const index = users.findIndex(x => x.ws === ws);
      if (index !== -1) {
        users.splice(index, 1);
      }
    });

    ws.on('message', async function message(data) {
      // Anything can arrive on a socket, and this handler is async, so an
      // uncaught throw becomes an unhandled rejection and Node exits the
      // process: one bad message would disconnect every user in every room.
      let raw: unknown;
      try {
        raw = JSON.parse(data.toString());
      } catch {
        return;
      }

      const parsed = WsMessageSchema.safeParse(raw);
      if (!parsed.success) {
        return;
      }
      const parsedData = parsed.data;

      const user = users.find(x => x.ws === ws);
      if (!user) {
        return;
      }

      if (parsedData.type === "join_room") {
        if (!user.rooms.includes(parsedData.roomId)) {
          user.rooms.push(parsedData.roomId);
        }
        return;
      }

      if (parsedData.type === "leave_room") {
        user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
        return;
      }

      if (parsedData.type === "chat") {
        const { roomId, message } = parsedData;

        // The token proves who you are; it does not say where you are allowed
        // to write. Without this check any signed-in client could write into
        // and broadcast to a room it never joined.
        if (!user.rooms.includes(roomId)) {
          return;
        }

        try {
          await prismaClient.chat.create({
            data: {
              roomId: Number(roomId),
              message,
              userId
            }
          });
        } catch (e) {
          // A roomId that is not a number, or names a room that does not
          // exist, is rejected by Postgres. Log it and keep serving.
          console.error("could not store message", e);
          return;
        }

        users.forEach(other => {
          if (other.rooms.includes(roomId)) {
            other.ws.send(JSON.stringify({
              type: "chat",
              message: message,
              roomId
            }))
          }
        })
      }
    });
  });

  return wss;
}

// Run on our own port when started directly. http-backend sets WS_EMBEDDED so
// that importing this file mounts the server instead of opening a second one.
if (!process.env.WS_EMBEDDED) {
  // Hosts assign the port; ignoring it means traffic never reaches the process.
  createWebSocketServer({ port: Number(process.env.PORT) || 8080 });
}
