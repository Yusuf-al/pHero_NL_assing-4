import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendRespone } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { propertiesServices } from "./properties.service";

const createPropertyIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const propertiesData = req.body;
    const userId = "cmryy6ooj0000zgk61uzd1fax";

    const result = await propertiesServices.createProperty(
      propertiesData,
      userId as string,
    );

    sendRespone(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "New Property has been created",
      data: result,
    });
  },
);

const getAllPropertiesFromDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const allProperties = await propertiesServices.allProperties();
    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All properties retrived successfully",
      data: allProperties,
    });
  },
);

export const propertiesController = {
  createPropertyIntoDB,
  getAllPropertiesFromDB,
};
