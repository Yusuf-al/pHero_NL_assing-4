import { Router } from "express";

import { userController } from "./users.controller";

import { Role } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/auth";

const userRoutes = Router();

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        name: string;
        id: string;
        role: Role;
      };
    }
  }
}

userRoutes.post("/register", userController.createUserIntoDB);
userRoutes.get(
  "/me",
  auth([Role.ADMIN, Role.USER]),
  userController.getMyProfile,
);
userRoutes.put(
  "/my-profile",
  auth([Role.ADMIN, Role.USER]),
  userController.updateMyProfile,
);

export default userRoutes;
