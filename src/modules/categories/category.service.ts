import { prisma } from "../../lib/prisma";

const newCategory = async (payload: any) => {
  const { name, description } = payload;

  const newCategory = await prisma.category.create({
    data: {
      name,
      description,
    },
  });

  if (!newCategory) throw new Error("Failed to create new category");

  return newCategory;
};

const allCategories = async () => {
  const categoriesList = await prisma.category.findMany();

  if (!categoriesList) throw new Error("Failed to collect all categories");

  return categoriesList;
};

export const categoryServices = {
  newCategory,
  allCategories,
};
