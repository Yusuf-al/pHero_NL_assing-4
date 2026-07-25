import { UserStatus } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const allUser = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      address: true,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (users.length === 0) {
    throw AppError.notFound("No Users are found");
  }

  return users;
};

const updateUserStatus = async (status: UserStatus, userId: string) => {
  const updatedStatus = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive: status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return updatedStatus;
};

export const adminServices = {
  allUser,
  updateUserStatus,
};
