import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common';
const wss = new WebSocketServer({ port: 8080 });
const users = [];
function checkUser(token) {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") {
        return null;
    }
    if (!decoded || !decoded.userId) {
        return null;
    }
    return decoded.userId;
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
    });
    ws.on("message", (data) => {
        const parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
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
            users.forEach(user => {
                if (user.rooms.includes(roomId)) {
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message: message,
                        roomId
                    }));
                }
            });
        }
    });
    return;
});
