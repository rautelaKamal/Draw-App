import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "./config";

const wss = new WebSocketServer({ port: 8080 });

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

  let decoded: string | JwtPayload;

  // verify token safely
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    ws.close();
    return;
  }

  //  narrow payload shape
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("userId" in decoded)
  ) {
    ws.close();
    return;
  }

  // ✅ Step 4: now it is safe
  const payload = decoded as JwtPayload & { userId: string };

  console.log("Connected user:", payload.userId);

  ws.on("message", () => {
    ws.send("pong");
  });
});