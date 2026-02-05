import { useEffect, useState } from "react";
import { WS_URL } from "../config";

export function useSocket() {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => {
            setSocket(ws);
        }
        ws.onclose = () => {
            setSocket(null);
        }
        return () => {
            ws.close();
        }
    }, []);

    return {
        socket,
        loading: socket === null
    };
}