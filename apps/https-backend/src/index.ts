import express from "express";
import jwt from "jsonwebtoken";
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

    await prisma.user.create({
      data: {
        email: parsedData.data.username,
        password: parsedData.data.password,
        name: parsedData.data.name
      }
    });

    res.json({
      roomId: 123
    });
  } catch (e) {
    res.status(411).json({
      message: "User already existed with this username"
    });
  }
});


app.post("/signin", (req, res) => {
  const data = SigninSchema.safeParse(req.body);
  if (!data.success) {
    return res.json({
      message: "incorrect inputs"
    })
    return;
  }
  const userId = 1;
  const token = jwt.sign({
    userId
  }, JWT_SECRET)

  res.json({
    token
  })
})

app.post("/room ", middleware, (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);
  if (!data.success) {
    return res.json({
      message: "incorrect inputs"
    })
    return;
  }
  // db call 
  res.json({
    roomId: 123
  })

})

app.listen(3001);