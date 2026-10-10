import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// Express's Request carries no userId. Declaring it here is how the verified
// user reaches the route handlers, and it replaces the @ts-ignore that used to
// sit on the assignment below.
declare global {
    namespace Express {
        interface Request { userId?: string }
    }
}

export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? "";

    // jwt.verify throws on a missing/expired/tampered token, which without this
    // catch escapes as a 500 HTML stack trace instead of a clean 403.
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // 401, not 403: 401 means the request carried no usable identity, so
        // sign in and retry. 403 would mean we know who you are and you are
        // not allowed, which is a different thing.
        if (typeof decoded === "string" || !decoded.userId) {
            res.status(401).json({
                message: "Unauthorized"
            })
            return;
        }

        req.userId = decoded.userId;
        next();
    } catch (e) {
        res.status(401).json({
            message: "Unauthorized"
        })
    }
}