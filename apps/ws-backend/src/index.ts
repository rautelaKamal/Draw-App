import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common';
import { prisma } from "@repo/db";
const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket,
  userId: string,
  rooms: string[]
}
const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded == "string") {
      return null;
    }
    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded.userId;
  }

  catch (e) {
    return null;
  }
}


wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");

  // token must exist
  if (!token) {
    ws.close();
    return;
  }
  const userId = checkUser(token);
  if (!userId) {
    ws.close();
    return;
  }

  if (userId == null) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on("message", async (data) => {
    const parsedData = JSON.parse(data as unknown as string); // {type: "join-room", roomId: 1}
    if (parsedData.type == "join-room") {
      const user = users.find(u => u.userId == userId);
      if (user) {
        user.rooms.push(parsedData.roomId);
      }
    }

    if (parsedData.type === "leave-room") {
      const user = users.find(u => u.userId == userId);
      if (!user) {
        return;
      }
      user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
    }

    if (parsedData.type == "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      await prisma.chat.create({
        data: {
          roomId,
          message,
          userId
        }
      });
      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId
          }));
        }
      })
    }
  });
  return;
});