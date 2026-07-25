import { Prisma } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const newCategory = async (payload: Prisma.CategoryCreateInput) => {
  const { name, description } = payload;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw AppError.badRequest("Category name is required.");
  }

  const existing = await prisma.category.findFirst({
    where: {
      name: {
        equals: name.trim(),
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw AppError.conflict(`Category "${name}" already exists.`);
  }

  const newCategory = await prisma.category.create({
    data: {
      name: name.trim(),
      description,
    },
  });

  return newCategory;
};

const allCategories = async () => {
  const categoriesList = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return categoriesList;
};

export const categoryServices = {
  newCategory,
  allCategories,
};
