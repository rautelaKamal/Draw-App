"use client";

import {WS_URL} from "@/config";
import { useState, useEffect, useRef } from "react";
import { initDraw } from "@/draw";
import { Canvas } from "./Canvas";
export function RoomCanvas({ roomId }: { roomId: string }) {
 
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws/${roomId}`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(JSON.stringify({
        type: "Join_room",
        roomId
      }))
    };
  }, []);

  

  if (!socket) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket!} />
    </div>
  );
}