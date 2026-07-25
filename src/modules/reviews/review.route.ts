import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { reviewController } from "./review.controller";

const reviewRoute = Router();

reviewRoute.post(
  "/create/:id",
  auth([UserRole.TENANT]),
  reviewController.createReviewIntoDB,
);

export default reviewRoute;
