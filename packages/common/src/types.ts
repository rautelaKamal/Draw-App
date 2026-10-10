import { z } from "zod";

// username is stored in the User.email column, so validate it as an email
// rather than capping it at 20 chars, which rejected most real addresses.
export const CreateUserSchema = z.object({
    username: z.string().email(),
    password: z.string().min(5),
    name: z.string().min(1)
})

export const SigninSchema = z.object({
    username: z.string().email(),
    password: z.string(),
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20),
})

// Socket messages arrive from the network like any request body, so they get
// the same Zod treatment as the REST routes. Without this one malformed
// message throws inside an async handler, which Node turns into an unhandled
// rejection and exits the process, disconnecting every user in every room.
export const WsMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("join_room"),
        roomId: z.string().min(1).max(64),
    }),
    z.object({
        type: z.literal("leave_room"),
        roomId: z.string().min(1).max(64),
    }),
    z.object({
        type: z.literal("chat"),
        roomId: z.string().min(1).max(64),
        // One shape, serialised. The cap stops a single client storing and
        // broadcasting megabytes, which would then replay on every load.
        message: z.string().max(32 * 1024),
    }),
])

export type WsMessage = z.infer<typeof WsMessageSchema>
