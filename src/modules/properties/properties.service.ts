import { prisma } from "../../lib/prisma";

const createProperty = async (payload: any, userId: string) => {
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

  const landlordId = userId;

  const categoryId = "cmryy6ooj0000zgk61uzd1ret";

  const property = await prisma.property.create({
    data: {
      title,
      description,
      rent: Number(rent),
      address,
      city,
      area,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      status,
      landlordId,
      categoryId,
    },
  });

  if (!property) throw new Error("Failed to create new Property");

  return property;
};

const allProperties = async () => {
  const result = await prisma.property.findMany({
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
  });

  if (!result) throw new Error("Failed to get All properties");

  return result;
};

export const propertiesServices = {
  createProperty,
  allProperties,
};
