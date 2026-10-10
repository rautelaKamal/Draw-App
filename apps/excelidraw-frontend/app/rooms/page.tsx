"use client";

import { HTTP_BACKEND, TOKEN_KEY } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomsPage() {
    const router = useRouter();
    const [createName, setCreateName] = useState("");
    const [joinName, setJoinName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(TOKEN_KEY)) {
            router.replace("/signin");
            return;
        }
        setReady(true);
    }, [router]);

    async function createRoom() {
        setError("");
        setLoading(true);
        try {
            const res = await axios.post(`${HTTP_BACKEND}/room`, {
                name: createName
            }, {
                // middleware reads the raw header, no "Bearer " prefix
                headers: { authorization: localStorage.getItem(TOKEN_KEY) ?? "" }
            });
            router.push(`/canvas/${res.data.roomId}`);
        } catch (e) {
            // The server answers 4xx now, so the specific cases live here
            // rather than in a branch after a 200 that can never run.
            const status = axios.isAxiosError(e) ? e.response?.status : null;
            if (status === 409) {
                setError(`A room called "${createName}" already exists`);
            } else if (status === 400) {
                setError("Room names are 3 to 20 characters");
            } else if (status === 401 || status === 403) {
                setError("Your session expired. Sign in again.");
            } else {
                setError("Could not create the room");
            }
        } finally {
            setLoading(false);
        }
    }

    async function joinRoom() {
        setError("");
        setLoading(true);
        try {
            const res = await axios.get(`${HTTP_BACKEND}/room/${joinName}`);
            router.push(`/canvas/${res.data.room.id}`);
        } catch (e) {
            const status = axios.isAxiosError(e) ? e.response?.status : null;
            setError(status === 404
                ? `No room called "${joinName}"`
                : "Could not join the room");
        } finally {
            setLoading(false);
        }
    }

    function signOut() {
        localStorage.removeItem(TOKEN_KEY);
        router.replace("/signin");
    }

    // Avoid flashing the form before we know there is a token.
    if (!ready) {
        return null;
    }

    return <div className="w-screen h-screen flex flex-col justify-center items-center gap-6 bg-background text-foreground">
        <h1 className="text-2xl font-semibold">Your rooms</h1>

        <div className="w-80 p-6 border border-border rounded-lg bg-card text-card-foreground">
            <h2 className="font-medium">Create a room</h2>
            <input
                className="border border-input rounded p-2 w-full mt-3 bg-background"
                type="text"
                placeholder="Room name (3-20 characters)"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
            />
            <button
                className="bg-primary text-primary-foreground rounded p-2 w-full mt-3 disabled:opacity-50"
                onClick={createRoom}
                disabled={loading || !createName}
            >
                Create and open
            </button>
        </div>

        <div className="w-80 p-6 border border-border rounded-lg bg-card text-card-foreground">
            <h2 className="font-medium">Join a room</h2>
            <input
                className="border border-input rounded p-2 w-full mt-3 bg-background"
                type="text"
                placeholder="Existing room name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
            />
            <button
                className="border border-border rounded p-2 w-full mt-3 disabled:opacity-50"
                onClick={joinRoom}
                disabled={loading || !joinName}
            >
                Join
            </button>
        </div>

        {error && <div className="text-sm text-destructive">
            {error}
        </div>}

        <button className="text-sm text-muted-foreground underline" onClick={signOut}>
            Sign out
        </button>
    </div>
}
