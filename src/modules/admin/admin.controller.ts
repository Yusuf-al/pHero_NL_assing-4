import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { adminServices } from "./admin.service";
import { sendRespone } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { UserStatus } from "../../../generated/prisma/client";

const allUsersFromDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const usersResult = await adminServices.allUser();

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All Rental Request",
      data: usersResult,
    });
  },
);

const updateUserStatusIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { isActive } = req.body;

    const result = await adminServices.updateUserStatus(
      isActive as UserStatus,
      userId as string,
    );

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User Status updated successfully",
      data: result,
    });
  },
);

export const adminController = {
  allUsersFromDB,
  updateUserStatusIntoDB,
};
