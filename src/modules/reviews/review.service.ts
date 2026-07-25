import { Prisma, RequestStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { IReview } from "./review.interface";

const submitReview = async (
  userId: string,
  propertyId: string,
  review: IReview,
) => {
  // Verify the user has an approved rental request
  const rentalRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId: userId,
      propertyId,
      status: RequestStatus.APPROVED,
    },
    select: {
      id: true,
    },
  });

  if (!rentalRequest) {
    throw new Error("Not allow to submit a review");
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
    throw new Error("You have already reviewed this property.");
  }

  if (review.rating < 1 || review.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
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
