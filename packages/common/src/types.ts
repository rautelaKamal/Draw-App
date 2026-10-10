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

// The socket layer checked that `message` was a string under a size cap, but
// never that it described a drawable shape. A pencil shape whose points are
// missing crashes drawPencil on every redraw, and since the row is stored it
// crashes again after a reload: one message poisons the room permanently.
const PointSchema = z.object({
    x: z.number().finite(),
    y: z.number().finite(),
})

export const ShapeSchema = z.discriminatedUnion("type", [
    z.object({
        id: z.string().max(64).optional(),
        type: z.literal("rect"),
        x: z.number().finite(),
        y: z.number().finite(),
        width: z.number().finite(),
        height: z.number().finite(),
    }),
    z.object({
        id: z.string().max(64).optional(),
        type: z.literal("circle"),
        centerX: z.number().finite(),
        centerY: z.number().finite(),
        radius: z.number().finite(),
    }),
    z.object({
        id: z.string().max(64).optional(),
        type: z.literal("pencil"),
        // Bounded so one stroke cannot grow past the message size cap, which
        // the server would then drop without telling anyone.
        points: z.array(PointSchema).min(1).max(1000),
    }),
])

// Every row in the log is one of these two: a shape, or a tombstone naming the
// id of a shape to hide.
export const ChatMessageSchema = z.union([
    z.object({ shape: ShapeSchema }),
    z.object({ erase: z.string().min(1).max(64) }),
])
