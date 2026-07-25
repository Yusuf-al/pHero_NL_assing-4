import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status";
import { sendRespone } from "../../utils/sendResponse";
import { categoryServices } from "./category.service";

const createCategoryIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const categoryData = req.body;

    const result = await categoryServices.newCategory(categoryData);

    sendRespone(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "New Property has been created",
      data: result,
    });
  },
);

const getAllCategoriesFromDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await categoryServices.allCategories();

    sendRespone(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All categories",
      data: result,
    });
  },
);

export const categoryController = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
};
