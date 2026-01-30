import { Request,Response,NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"
import { JWT_SECRET } from "./config";
 export function middleware(req: Request, res: Response, next: NextFunction){
    const token = req.headers["authorization"] ?? "";

    const decoded = jwt.verify(token,JWT_SECRET) as JwtPayload & {
        userId: string;
    };

    if(decoded){
        req.userId = decoded.userId; 
        next();
    }else{
        res.status(403).json({
            message: "unauthorzed"
        })
    }
 }