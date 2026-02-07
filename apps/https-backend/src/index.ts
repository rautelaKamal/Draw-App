import express from "express";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { JWT_SECRET } from '@repo/backend-common';
import { middleware } from "./middleware.js";
import { CreateUserSchema, CreateRoomSchema, SigninSchema } from "@repo/common/types";
import { prisma } from "@repo/db";
const app = express();
app.use(express.json())

app.post("/signup", async (req, res) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "incorrect inputs"
    });
  }

  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsedData.data.username,
        password: hashedPassword,
        name: parsedData.data.name
      }
    });

    res.json({
      message: "User created successfully",
      userId: user.id
    });
  } catch (e: any) {
    console.error("Signup error:", e);

    // Check if it's a unique constraint violation (duplicate email)
    if (e.code === 'P2002') {
      return res.status(411).json({
        message: "User already exists with this username"
      });
    }

    // Other database or connection errors
    res.status(500).json({
      message: "Error creating user",
      error: e.message
    });
  }
});


app.post("/signin", async (req, res) => {
  const parsedData = SigninSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "incorrect inputs"
    });
  }

  // Find user by email only
  const user = await prisma.user.findFirst({
    where: {
      email: parsedData.data.username
    }
  });

  if (!user) {
    return res.status(411).json({
      message: "User not found"
    });
  }

  // Compare the provided password with the hashed password
  const isPasswordValid = await bcrypt.compare(parsedData.data.password, user.password);

  if (!isPasswordValid) {
    return res.status(411).json({
      message: "Invalid password"
    });
  }

  const token = jwt.sign({
    userId: user.id
  }, JWT_SECRET);

  res.json({
    token
  });
})

app.post("/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "incorrect inputs"
    });
  }

  const userId = req.userId;
  if (!userId) {
    return res.status(403).json({
      message: "Unauthorized"
    });
  }
  try {
    const room = await prisma.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: userId
      }
    })
    res.json({
      roomId: room.id
    })
  } catch (e: any) {
    console.error("Room creation error:", e);
    res.status(500).json({
      message: "Error creating room",
      error: e.message
    });
  }

  app.get("/chats/:roomId", async (req, res) => {
    const roomId = req.params.roomId;
    const messages = await prisma.chat.findMany({
      where: {
        roomId: Number(roomId)
      },
      take: 50,
      orderBy: {
        id: "desc"
      }
    })
    res.json({
      messages
    })
  })
})

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prisma.room.findFirst({
    where: {
      slug: slug
    }
  })
  res.json({
    room
  })
})
app.listen(3001);