import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import { createWebSocketServer } from "ws-backend/server";
import cors from "cors";

const app = express();
app.use(express.json());

// Once the frontend is on its own domain, an open CORS policy lets any site
// call this API with a user's credentials. Locked to the known origin when
// one is configured; open in local dev, where there isn't one.
const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}))

app.post("/signup", async (req, res) => {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                // Stored as a bcrypt hash, never as the password itself, so a
                // dump of this table does not hand over anyone's login.
                password: await bcrypt.hash(parsedData.data.password, 10),
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists with this username"
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    // The password cannot be part of the query any more: a hash only matches
    // through bcrypt.compare, which re-hashes the attempt with the salt stored
    // in the hash itself.
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username
        }
    })

    // Same response whether the email is unknown or the password is wrong, so
    // the endpoint cannot be used to find out which accounts exist.
    if (!user || !(await bcrypt.compare(parsedData.data.password, user.password))) {
        res.status(403).json({
            message: "Not authorized"
        })
        return;
    }

    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    // @ts-ignore: TODO: Fix this
    const userId = req.userId;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.json({
            roomId: room.id
        })
    } catch(e) {
        res.status(411).json({
            message: "Room already exists with this name"
        })
    }
})

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})

// Hosts assign the port; ignoring it means traffic never reaches the process.
const server = app.listen(Number(process.env.PORT) || 3001);

// Free hosting gives one port per service, so in production the socket server
// rides on this HTTP server instead of opening its own. ws-backend still runs
// standalone in development; this only changes where it is mounted.
if (process.env.WS_EMBEDDED) {
    createWebSocketServer({ server, path: "/ws" });
}