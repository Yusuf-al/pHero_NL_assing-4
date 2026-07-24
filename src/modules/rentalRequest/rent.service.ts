import { Prisma, UserRole } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { IUserPayload } from "../users/users.interface";

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
    throw new Error("Only tenants can request rental.");
  }

  const moveInDate = new Date(payload.moveInDate as Date);
  const moveOutDate = new Date(payload.moveOutDate as Date);

  // Validate dates
  if (moveInDate >= moveOutDate) {
    throw new Error("Move-in date should be before move-out date.");
  }

  // Check property availability
  const existingBooking = await prisma.rentalRequest.findFirst({
    where: {
      propertyId,

      // only check confirmed/approved rentals
      status: {
        in: ["APPROVED"],
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
    throw new Error("Property is not available for the selected dates.");
  }

  // Prevent duplicate request by same tenant
  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId: userData.id,
      propertyId,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    throw new Error("You already requested this property.");
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

const allRentalRequest = async () => {
  const allRequest = await prisma.rentalRequest.findMany({
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
  });

  if (allRequest.length === 0) {
    throw new Error("No rental requests found");
  }

  return allRequest;
};

export const rentalService = {
  newRentRequset,
  allRentalRequest,
};
