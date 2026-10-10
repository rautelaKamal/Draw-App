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

        // Two different failures arrive as the same event. A close before the
        // socket ever opened means ws-backend rejected the token. A close after
        // it opened means the connection dropped mid-session, which previously
        // showed nothing at all: you carried on drawing into a dead socket and
        // nobody saw any of it.
        ws.onclose = () => {
            if (cancelled) {
                return;
            }
            setSocket(null);
            setError(opened
                ? "Connection lost. Reload the page to keep drawing."
                : "Could not connect. Try signing in again.");
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
