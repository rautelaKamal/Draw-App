const secret = process.env.JWT_SECRET;

// Falling back to a public default in production would let anyone forge a
// token for any user, so fail at boot instead of running insecurely.
if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
}

export const JWT_SECRET = secret || "dev-only-insecure-secret";
