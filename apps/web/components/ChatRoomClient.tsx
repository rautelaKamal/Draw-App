"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export function ChatRoomClient({
    id,
    messages
}: {
    id: string;
    messages: { message: string }[];
}) {
    const { socket, loading } = useSocket();
    const [chats, setChats] = useState(messages.map(x => x.message));
    const [currentMessage, setCurrentMessage] = useState("");

    useEffect(() => {
        if (socket && !loading) {

            socket.send(JSON.stringify({
                type: "join-room",
                roomId: id
            }));

            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                if (parsedData.type === "chat") {
                    setChats(c => [...c, parsedData.message])
                }
            }
        }
    }, [socket, loading, id]);

    return <div>
        {chats.map((m, i) => <div key={i}>{m}</div>)}

        <input type="text" value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} />
        <button onClick={() => {
            socket?.send(JSON.stringify({
                type: "chat",
                roomId: id,
                message: currentMessage
            }))
            setCurrentMessage("");
        }}>Send message</button>
    </div>
}