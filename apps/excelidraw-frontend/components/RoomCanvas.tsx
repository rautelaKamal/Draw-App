"use client";

import { TOKEN_KEY, WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({roomId}: {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setError("You need to sign in before joining a room.");
            return;
        }

        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        let opened = false;
        // Set by cleanup, so the close we cause ourselves is not read as a
        // failure. Strict mode remounts this effect, which would otherwise
        // leave a stale error on screen while the second socket connects fine.
        let cancelled = false;

        ws.onopen = () => {
            opened = true;
            setError("");
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }));
        }

        // ws-backend closes the socket without a message when the token is
        // rejected, so a close before open means the token is bad or expired.
        ws.onclose = () => {
            if (!opened && !cancelled) {
                setError("Could not connect. Try signing in again.");
            }
        }

        return () => {
            cancelled = true;
            ws.close();
        }
    }, [roomId])

    if (error) {
        return <div>
            {error}
        </div>
    }

    if (!socket) {
        return <div>
            Connecting to server....
        </div>
    }

    return <div>
        <Canvas roomId={roomId} socket={socket} />
    </div>
}
