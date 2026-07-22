import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { sendRespone } from "../utils/sendResponse";
import { Active_Status, Role } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";

export const auth = (roles: Role[] = []) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization);

    if (!accessToken)
      throw new Error("You are not logged in. Please login to access");

    const { success, token } = jwtUtils.verifyToken(
      accessToken,
      config.jwt_access_secret,
    );
    if (!success || !token) throw new Error();

    const { email, role, id, name } = token;

    if (roles.length && !roles.includes(role))
      return sendRespone(res, {
        success: false,
        statusCode: 403,
        message: "Access forbidden",
      });

    const user = await prisma.user.findUnique({
      where: {
        email,
        id,
        role,
        name,
      },
    });

    if (!user) throw new Error("User not found");

    if (user.isActive === Active_Status.BLOCKED) {
      throw new Error(
        " Your account has been blocked, Please contact the support",
      );
    }

    req.user = {
      email,
      name,
      role,
      id,
    };

    next();
  });
};
