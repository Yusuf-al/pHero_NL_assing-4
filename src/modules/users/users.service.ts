import bcrypt from "bcryptjs";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import jwt from "jsonwebtoken";
import { Role } from "../../../generated/prisma/client";

interface IPayload {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface IUserPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const createUser = async (payload: IPayload) => {
  const { id, name, email, password } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
      id,
    },
  });

  if (isUserExist) throw new Error("User with this email already exist");

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_round),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email || email,
    },
    omit: {
      password: true,
    },
  });

  return user;
};

const getUserProfile = async (payload: IUserPayload) => {
  const user = payload;

  const userProfile = await prisma.user.findUnique({
    where: { id: user?.id },
  });

  if (!userProfile) throw new Error("User not found");

  const userFormatedData = {
    name: userProfile.name,
    email: userProfile.email,
  };

  return userFormatedData;
};

const updateUserProfile = async (userdata: IUserPayload, payload: any) => {
  const { email, name } = payload;
  const { id: userId, email: userEmail } = userdata;

  const updateProfile = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      email,
      name,
    },
    omit: {
      password: true,
    },
  });

  if (!updateProfile) throw new Error("user not found");

  return updateProfile;
};

export const userService = {
  createUser,
  getUserProfile,
  updateUserProfile,
};
