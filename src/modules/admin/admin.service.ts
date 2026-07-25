import { Prisma, UserStatus } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  buildPaginationMeta,
  calculatePagination,
} from "../../utils/paginationHelper";
import { IUserQuery } from "./admin.interface";

const userSearchableFields: (keyof Prisma.UserWhereInput)[] = [
  "name",
  "email",
  "phone",
];

const allUser = async (query: IUserQuery) => {
  const { searchTerm, role, isActive } = query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(query);

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (isActive) {
    andConditions.push({ isActive });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        isActive: true,
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.user.count({ where: whereConditions }),
  ]);

  return {
    data: users,
    meta: buildPaginationMeta(total, { page, limit }),
  };
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
