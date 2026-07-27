import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";

const paymentRoute = Router();

paymentRoute.post(
  "/:id/create-payment-session",
  auth([UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT]),
  paymentController.createPaymentSession,
);

paymentRoute.post("/webhook", paymentController.handleWebhook);

export default paymentRoute;
