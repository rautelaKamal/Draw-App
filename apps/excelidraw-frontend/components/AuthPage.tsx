"use client";

import { HTTP_BACKEND, TOKEN_KEY } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthPage({isSignin}: {
    isSignin: boolean
}) {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setError("");
        setLoading(true);

        try {
            if (isSignin) {
                const res = await axios.post(`${HTTP_BACKEND}/signin`, {
                    username,
                    password
                });
                // The backend answers 200 with just a message when validation fails,
                // so the token itself is what tells us the request actually worked.
                if (!res.data.token) {
                    setError(res.data.message ?? "Could not sign in");
                    return;
                }
                localStorage.setItem(TOKEN_KEY, res.data.token);
                router.push("/rooms");
            } else {
                const res = await axios.post(`${HTTP_BACKEND}/signup`, {
                    username,
                    password,
                    name
                });
                if (!res.data.userId) {
                    setError(res.data.message ?? "Could not sign up");
                    return;
                }
                router.push("/signin");
            }
        } catch (e) {
            const message = axios.isAxiosError(e) ? e.response?.data?.message : null;
            setError(message ?? "Something went wrong, please try again");
        } finally {
            setLoading(false);
        }
    }

    return <div className="w-screen h-screen flex justify-center items-center">
        <form className="p-6 m-2 bg-white rounded" onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
        }}>
            <div className="p-2">
                <input
                    className="border rounded p-2 w-full"
                    type="text"
                    placeholder="Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="p-2">
                <input
                    className="border rounded p-2 w-full"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            {!isSignin && <div className="p-2">
                <input
                    className="border rounded p-2 w-full"
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>}

            {error && <div className="px-2 text-sm text-red-600">
                {error}
            </div>}

            <div className="pt-2 px-2">
                <button className="bg-red-200 rounded p-2 w-full disabled:opacity-50" type="submit" disabled={loading}>
                    {loading ? "Please wait..." : (isSignin ? "Sign in" : "Sign up")}
                </button>
            </div>
        </form>
    </div>

}
