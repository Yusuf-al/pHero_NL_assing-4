import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { reviewService } from "./review.service";
import { IReview } from "./review.interface";
import { sendRespone } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createReviewIntoDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const propertyId = req.params.id;

    const review = req.body;

    const newReviewResult = await reviewService.submitReview(
      userId as string,
      propertyId as string,
      review as IReview,
    );

    sendRespone(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Review submitted successfully",
      data: newReviewResult,
    });
  },
);

export const reviewController = {
  createReviewIntoDB,
};
