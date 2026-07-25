import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { rentalService } from "./rent.service";
import { IUserPayload } from "../users/users.interface";
import httpStatus from "http-status";
import { sendRespone } from "../../utils/sendResponse";
import { RequestStatus } from "../../../generated/prisma/client";
import { IRentalRequestQuery } from "./rent.interface";

const createNewRentRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.user;
    const payload = req.body;
    const propertyId = req.params.id;

    const result = await rentalService.newRentRequset(
      payload,
      userData as IUserPayload,
      propertyId as string,
    );

    sendRespone(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Rent Request has been submitted",
      data: result,
    });
  },
);

const getAllRentalRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await rentalService.allRentalRequest(
      req.query as IRentalRequestQuery,
    );
    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All Rental Request retrived successfully",
      data: result,
    });
  },
);

const requestStatusUpdate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.user;
    const requestId = req.params.id;
    const { status } = req.body;

    const result = await rentalService.updateRequestStatus(
      requestId as string,
      status as RequestStatus,
      userData as IUserPayload,
    );

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Request status updated successfully",
      data: result,
    });
  },
);

export const rentalController = {
  createNewRentRequest,
  getAllRentalRequest,
  requestStatusUpdate,
};
