import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";


export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? "";

    // jwt.verify throws on a missing/expired/tampered token, which without this
    // catch escapes as a 500 HTML stack trace instead of a clean 403.
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string" || !decoded.userId) {
            res.status(403).json({
                message: "Unauthorized"
            })
            return;
        }

        // @ts-ignore: TODO: Fix this
        req.userId = decoded.userId;
        next();
    } catch (e) {
        res.status(403).json({
            message: "Unauthorized"
        })
    }
}