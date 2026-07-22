import { Request, Response } from "express";
import httpStatus from "http-status";
import { userService } from "./users.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendRespone } from "../../utils/sendResponse";

const createUserIntoDB = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: user,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userData = req.user;

  if (!userData) throw new Error("User not found");

  const myProfile = await userService.getUserProfile(userData);
  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Information ",
    data: myProfile,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userData = req.user;

  if (!userData) throw new Error("User not found");

  const updatedData = await userService.updateUserProfile(userData, req.body);

  sendRespone(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Information updated successfully",
    data: updatedData,
  });
});

export const userController = {
  createUserIntoDB,
  getMyProfile,
  updateMyProfile,
};
