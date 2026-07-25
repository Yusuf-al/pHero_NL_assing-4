import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendRespone } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { propertiesServices } from "./properties.service";
import { IUserPayload } from "../users/users.interface";
import { IPropertyQuery } from "./properties.interface";

const createPropertyIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const propertiesData = req.body;

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
    const allProperties = await propertiesServices.allProperties(
      req.query as IPropertyQuery,
    );
    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All properties retrived successfully",
      data: allProperties,
    });
  },
);

const updatePropertyIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userdata = req.user;

    const propertyId = req.params.id;
    const updatedData = req.body;

    const result = await propertiesServices.updateProperty(
      updatedData,
      userdata as IUserPayload,
      propertyId as string,
    );
    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Properties Updated successfully",
      data: result,
    });
  },
);

const deletePropertyFromDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.user;
    const propertyId = req.params.id;

    const result = await propertiesServices.deleteProperty(
      propertyId as string,
      userData as IUserPayload,
    );

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Properties deleted successfully",
    });
  },
);

const userRentalRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userdata = req.user;

    const result = await propertiesServices.getUserRentalRequest(
      userdata as IUserPayload,
    );

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All Rental Request",
      data: result,
    });
  },
);

export const propertiesController = {
  createPropertyIntoDB,
  getAllPropertiesFromDB,
  updatePropertyIntoDB,
  deletePropertyFromDB,
  userRentalRequest,
};
