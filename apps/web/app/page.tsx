"use client";
import styles from "./page.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  return (
    <div style={
      {
        display: "flex",
        width: "100vw",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center"
      }}>
      <div>
        <input style={{
          padding: 10
        }} value={roomId} onChange={(e) => setRoomId(e.target.value)}
          type="text" placeholder="Room ID"></input>
        <button style={{
          padding: 10
        }} onClick={() => router.push(`/room/${roomId}`)}>Join room</button> // directly takes you to route to room
      </div>

    </div>
  );
}
