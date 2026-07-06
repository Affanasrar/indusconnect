import bcrypt from "bcryptjs";
import { RoleName } from "@prisma/client";
import prisma from "../../config/prisma";
import { CreateUserInput, UpdateUserInput } from "./user.validation";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  employeeCode: true,
  department: true,
  hrGrade: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
};

export async function getAllUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function createUser(data: CreateUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const role = await prisma.role.findUnique({
    where: {
      name: data.role,
    },
  });

  if (!role) {
    throw new Error("Selected role does not exist");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      roleId: role.id,
      employeeCode: data.employeeCode,
      department: data.department,
      hrGrade: data.hrGrade,
    },
    select: userSelect,
  });
}

export async function updateUser(id: string, data: UpdateUserInput) {
  await getUserById(id);

  let roleId: string | undefined;

  if (data.role) {
    const role = await prisma.role.findUnique({
      where: {
        name: data.role as RoleName,
      },
    });

    if (!role) {
      throw new Error("Selected role does not exist");
    }

    roleId = role.id;
  }

  return prisma.user.update({
    where: { id },
    data: {
      fullName: data.fullName,
      phone: data.phone,
      status: data.status,
      roleId,
      employeeCode: data.employeeCode,
      department: data.department,
      hrGrade: data.hrGrade,
    },
    select: userSelect,
  });
}