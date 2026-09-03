
// Set at build time by Next: NEXT_PUBLIC_* values are inlined into the client
// bundle, so these must be supplied as build args in Docker, not at runtime.
export const HTTP_BACKEND = process.env.NEXT_PUBLIC_HTTP_BACKEND ?? "http://localhost:3001";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

// localStorage key holding the JWT handed out by /signin
export const TOKEN_KEY = "token";
