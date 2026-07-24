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

export const categoryServices = {
  newCategory,
};
