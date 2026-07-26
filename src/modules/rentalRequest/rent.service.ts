import {
  Prisma,
  PropertyStatus,
  RequestStatus,
  UserRole,
} from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  buildPaginationMeta,
  calculatePagination,
} from "../../utils/paginationHelper";
import { IUserPayload } from "../users/users.interface";
import { IRentalRequestQuery } from "./rent.interface";

const newRentRequset = async (
  payload: Prisma.RentalRequestCreateInput,
  userData: IUserPayload,
  propertyId: string,
) => {
  if (userData.role !== UserRole.TENANT) {
    throw AppError.forbidden("Only tenants can request rental.");
  }

  const property = await prisma.property.findUniqueOrThrow({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
      status: true,
      rent: true,
    },
  });

  if (property.status !== PropertyStatus.AVAILABLE) {
    throw AppError.badRequest("This property is not available for rent.");
  }

  const MoveInDate = new Date(payload.moveInDate as Date);
  const MoveOutDate = new Date(payload.moveOutDate as Date);

  if (
    Number.isNaN(MoveInDate.getTime()) ||
    Number.isNaN(MoveOutDate.getTime())
  ) {
    throw AppError.badRequest("Invalid moveInDate or moveOutDate.");
  }

  if (MoveInDate >= MoveOutDate) {
    throw AppError.badRequest("Move-in date should be before move-out date.");
  }

  if (MoveInDate < new Date()) {
    throw AppError.badRequest("Move-in date cannot be in the past.");
  }

  // Check property availability against existing approved bookings
  const existingBooking = await prisma.rentalRequest.findFirst({
    where: {
      propertyId,
      status: RequestStatus.APPROVED,
      moveInDate: {
        lt: MoveOutDate,
      },
      moveOutDate: {
        gt: MoveInDate,
      },
    },
  });

  if (existingBooking) {
    throw AppError.conflict(
      "Property is not available for the selected dates.",
    );
  }

  // Prevent duplicate request by same tenant and overlap
  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId: userData.id,
      propertyId,
      status: RequestStatus.PENDING,
      moveInDate: { lt: MoveOutDate },
      moveOutDate: { gt: MoveInDate },
    },
  });

  if (existingRequest) {
    throw AppError.conflict("You already requested this property.");
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const dayCount = Math.ceil(
    (MoveOutDate.getTime() - MoveInDate.getTime()) / MS_PER_DAY,
  );

  const totalCost = property.rent * dayCount;

  const rentalRequest = await prisma.rentalRequest.create({
    data: {
      moveInDate: MoveInDate,
      moveOutDate: MoveOutDate,
      totalPrice: totalCost,
      message: payload.message,

      tenant: {
        connect: {
          id: userData.id,
        },
      },

      property: {
        connect: {
          id: property.id,
        },
      },
    },
  });

  return rentalRequest;
};

const allRentalRequest = async (query: IRentalRequestQuery) => {
  const { searchTerm, status } = query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const andConditions: Prisma.RentalRequestWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      property: {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { city: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereConditions: Prisma.RentalRequestWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [data, total] = await Promise.all([
    prisma.rentalRequest.findMany({
      where: whereConditions,
      select: {
        moveInDate: true,
        moveOutDate: true,
        status: true,
        message: true,

        property: {
          select: {
            title: true,
            status: true,
            city: true,
            address: true,

            landlord: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },

        tenant: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.rentalRequest.count({ where: whereConditions }),
  ]);

  if (data.length === 0)
    return {
      message: "Rental Request is empty. No request has not submitted yet",
      meta: buildPaginationMeta(total, { page, limit }),
    };

  return {
    data,
    meta: buildPaginationMeta(total, { page, limit }),
  };
};

const updateRequestStatus = async (
  requestId: string,
  status: RequestStatus,
  userData: IUserPayload,
) => {
  const request = await prisma.rentalRequest.findUniqueOrThrow({
    where: {
      id: requestId,
    },
    include: {
      property: {
        select: {
          landlordId: true,
        },
      },
    },
  });

  // Only landlord who owns the property or admin can update
  if (
    request.property.landlordId !== userData.id &&
    userData.role !== UserRole.ADMIN
  ) {
    throw AppError.forbidden(
      "You are not authorized to update this rental request.",
    );
  }

  // PENDING can move to APPROVED, REJECTED, or CANCELED
  if (request.status === RequestStatus.PENDING) {
    const allowed: RequestStatus[] = [
      RequestStatus.APPROVED,
      RequestStatus.REJECTED,
      RequestStatus.CANCELLED,
    ];
    if (!allowed.includes(status)) {
      throw AppError.badRequest(
        "A pending request can only be approved, rejected, or canceled.",
      );
    }
  }

  // APPROVED can only move to COMPLETED
  else if (request.status === RequestStatus.APPROVED) {
    if (status !== RequestStatus.COMPLETED) {
      throw AppError.badRequest(
        "An approved request can only be marked as completed.",
      );
    }
  }

  // REJECTED, CANCELED, COMPLETED are final — nothing can change after that
  else {
    throw AppError.badRequest(
      `This request is already "${request.status}" and cannot be changed further.`,
    );
  }

  const updatedRequest = await prisma.rentalRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status,
    },
  });

  return updatedRequest;
};

export const rentalService = {
  newRentRequset,
  allRentalRequest,
  updateRequestStatus,
};
