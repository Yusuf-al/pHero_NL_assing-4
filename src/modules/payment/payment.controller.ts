import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentServices } from "./payment.service";
import { sendRespone } from "../../utils/sendResponse";

const createPaymentSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const rentRequestId = req.params.id;

    const result = await paymentServices.paymentSession(
      userId as string,
      rentRequestId as string,
    );

    sendRespone(res, {
      statusCode: 200,
      success: true,
      message: "Payment completed successfully",
      data: result,
    });
  },
);

export const paymentController = {
  createPaymentSession,
};
