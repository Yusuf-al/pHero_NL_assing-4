import { Prisma, UserRole } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  buildPaginationMeta,
  calculatePagination,
} from "../../utils/paginationHelper";
import { IUserPayload } from "../users/users.interface";
import { IPropertyQuery } from "./properties.interface";

const createProperty = async (
  payload: Prisma.PropertyCreateInput,
  userId: string,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (user.role !== UserRole.LANDLORD && user.role !== UserRole.ADMIN) {
    throw AppError.forbidden("Only LANDLORD and ADMIN can create properties");
  }

  const categoryId = "cmryy6ooj0000zgk61uzd1ret";

  const property = await prisma.property.create({
    data: {
      title: payload.title,
      description: payload.description,
      rent: Number(payload.rent),
      address: payload.address,
      city: payload.city,
      area: payload.area,
      bedrooms: Number(payload.bedrooms),
      bathrooms: Number(payload.bathrooms),
      status: payload.status,

      landlord: {
        connect: {
          id: user.id,
        },
      },

      category: {
        connect: {
          id: categoryId,
        },
      },
    },
  });

  return property;
};

const propertySearchableFields: (keyof Prisma.PropertyWhereInput)[] = [
  "title",
  "description",
  "city",
  "area",
  "address",
];

const allProperties = async (query: IPropertyQuery) => {
  const { searchTerm, city, area, categoryId, status, minRent, maxRent } =
    query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const andConditions: Prisma.PropertyWhereInput[] = [];

  // Free-text search parital match

  if (searchTerm) {
    andConditions.push({
      OR: propertySearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact-match filters
  if (city) {
    andConditions.push({ city: { equals: city, mode: "insensitive" } });
  }

  if (area) {
    andConditions.push({ area: { equals: area, mode: "insensitive" } });
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  if (status) {
    andConditions.push({ status });
  }

  // Range filters
  if (minRent !== undefined || maxRent !== undefined) {
    andConditions.push({
      rent: {
        ...(minRent !== undefined && { gte: minRent }),
        ...(maxRent !== undefined && { lte: maxRent }),
      },
    });
  }

  const whereConditions: Prisma.PropertyWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.property.findMany({
      where: whereConditions,
      include: {
        landlord: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      omit: {
        categoryId: true,
        landlordId: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.property.count({ where: whereConditions }),
  ]);

  if (!result) throw AppError.notFound("Failed to get all properties");

  return {
    data: result,
    meta: buildPaginationMeta(total, { page, limit }),
  };
};

const updateProperty = async (
  payload: Prisma.PropertyUpdateInput,
  userdata: IUserPayload,
  propertyId: string,
) => {
  const {
    title,
    description,
    rent,
    address,
    city,
    area,
    bedrooms,
    bathrooms,
    status,
  } = payload;

  const propertyData = await prisma.property.findUniqueOrThrow({
    where: {
      id: propertyId,
    },
  });

  if (!propertyData) throw AppError.notFound("Failed to get all properties");

  if (
    propertyData.landlordId !== userdata.id &&
    userdata.role !== UserRole.ADMIN
  ) {
    throw AppError.forbidden("You are not authorized to update this property.");
  }

  const updatedProperty = await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      title,
      description,
      rent,
      address,
      city,
      area,
      bedrooms,
      bathrooms,
      status,
    },
  });

  if (!updatedProperty) throw AppError.badRequest("Failed to updated property");

  return updatedProperty;
};

const deleteProperty = async (propertyId: string, userData: IUserPayload) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: {
      id: propertyId,
    },
    select: {
      landlordId: true,
    },
  });

  // Only owner or admin can delete
  if (property.landlordId !== userData.id && userData.role !== UserRole.ADMIN) {
    throw AppError.forbidden("You are not authorized to delete this property.");
  }

  const deletedProperty = await prisma.property.delete({
    where: {
      id: propertyId,
    },
  });

  return deletedProperty;
};

const getUserRentalRequest = async (userData: IUserPayload) => {
  const userRentReqest = await prisma.rentalRequest.findMany({
    where: {
      property: {
        landlordId: userData.id,
      },
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          area: true,
          rent: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    omit: {
      tenantId: true,
      propertyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (userRentReqest.length === 0) {
    return "You have not rent request";
  }

  return userRentReqest;
};

export const propertiesServices = {
  createProperty,
  allProperties,
  updateProperty,
  deleteProperty,
  getUserRentalRequest,
};
