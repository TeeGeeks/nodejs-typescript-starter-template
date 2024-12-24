import { createUser, getAllUsers, loginUser } from "@/controllers/users";
import express from "express";
const userRouter = express.Router();

userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);
userRouter.get("/users", getAllUsers);

export default userRouter;
