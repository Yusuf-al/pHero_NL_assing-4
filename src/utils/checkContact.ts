import { prisma } from "../lib/prisma";

export const validateContactExists = async (id: string) => {
  const exists = await prisma.contact.findUnique({
    where: { id },
  });

  if (!exists) {
    throw new Error("Contact not found");
  }

  return exists;
};
