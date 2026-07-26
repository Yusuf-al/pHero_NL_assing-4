import { Prisma, RequestStatus } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IReview } from "./review.interface";

const submitReview = async (
  userId: string,
  propertyId: string,
  review: IReview,
) => {
  if (review.rating < 1 || review.rating > 5) {
    throw AppError.badRequest("Rating must be between 1 and 5.");
  }
  // Verify the user has an approved rental request
  const rentalRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId: userId,
      propertyId,
      status: RequestStatus.COMPLETED,
    },
    select: {
      id: true,
    },
  });

  if (!rentalRequest) {
    throw AppError.forbidden(
      "You are not allowed to review this property. Only tenants with an approved rental request can leave a review.",
    );
  }

  // Prevent duplicate reviews
  const existingReview = await prisma.review.findFirst({
    where: {
      tenantId: userId,
      propertyId,
    },
    select: {
      id: true,
    },
  });

  if (existingReview) {
    throw AppError.conflict("You have already reviewed this property.");
  }

  // Create the review
  const newReview = await prisma.review.create({
    data: {
      tenantId: userId,
      propertyId,
      rating: review.rating,
      comment: review.comment,
    },
  });

  return newReview;
};

export const reviewService = {
  submitReview,
};
