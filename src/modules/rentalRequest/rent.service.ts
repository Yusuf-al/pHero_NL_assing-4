import {
  Prisma,
  RequestStatus,
  UserRole,
} from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { buildPaginationMeta, calculatePagination } from "../../utils/paginationHelper";
import { IUserPayload } from "../users/users.interface";
import { IRentalRequestQuery } from "./rent.interface";

const newRentRequset = async (
  payload: Prisma.RentalRequestCreateInput,
  userData: IUserPayload,
  propertyId: string,
) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  // Only tenants can request
  if (userData.role !== UserRole.TENANT) {
    throw AppError.forbidden("Only tenants can request rental.");
  }

  const moveInDate = new Date(payload.moveInDate as Date);
  const moveOutDate = new Date(payload.moveOutDate as Date);

  // Validate dates
  if (moveInDate >= moveOutDate) {
    throw AppError.badRequest("Move-in date should be before move-out date.");
  }

  if (moveInDate < new Date()) {
    throw AppError.badRequest("Move-in date cannot be in the past.");
  }

  // Check property availability
  const existingBooking = await prisma.rentalRequest.findFirst({
    where: {
      propertyId,

      // only check confirmed/approved rentals
      status: {
        in: [RequestStatus.APPROVED],
      },

      AND: [
        {
          moveInDate: {
            lt: moveOutDate,
          },
        },
        {
          moveOutDate: {
            gt: moveInDate,
          },
        },
      ],
    },
  });

  if (existingBooking) {
    throw AppError.conflict(
      "Property is not available for the selected dates.",
    );
  }

  // Prevent duplicate request by same tenant
  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId: userData.id,
      propertyId,
      status: RequestStatus.PENDING,
    },
  });

  if (existingRequest) {
    throw AppError.conflict("You already requested this property.");
  }

  // Create rental request
  const rentalRequest = await prisma.rentalRequest.create({
    data: {
      moveInDate,
      moveOutDate,
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

const allRentalRequest = async (query:IRentalRequestQuery) => {

  const {
    searchTerm,
    status,
  } = query;

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

  if (request.status !== RequestStatus.PENDING) {
    throw AppError.badRequest(
      `This request has already been ${request.status.toLowerCase()} and cannot be updated again.`,
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
