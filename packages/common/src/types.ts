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
