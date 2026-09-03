import { HTTP_BACKEND } from "@/config";
import axios from "axios";

type ChatRow = {
    id: number;
    message: string;
}

// The room is an append-only log, so replaying it means collecting the shapes
// and the erase tombstones, then dropping every shape a tombstone names.
export async function getExistingShapes(roomId: string) {
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages: ChatRow[] = res.data.messages;

    // The API returns newest first so the take(1000) keeps the most recent
    // slice; replay wants them oldest first or the z-order comes out inverted.
    const rows = [...messages].reverse();

    const shapes = [];
    const erased = new Set<string>();

    for (const row of rows) {
        let data;
        try {
            data = JSON.parse(row.message);
        } catch {
            continue;
        }

        if (data.erase) {
            erased.add(data.erase);
            continue;
        }

        if (data.shape) {
            // Shapes drawn before shapes carried ids can still be erased: the
            // row id is stable, so a tombstone against it survives a reload.
            if (!data.shape.id) {
                data.shape.id = `row-${row.id}`;
            }
            shapes.push(data.shape);
        }
    }

    return shapes.filter((shape) => !erased.has(shape.id));
}
