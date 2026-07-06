import { Request, Response } from "express";
import { createUserSchema, updateUserSchema } from "./user.validation";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "./user.service";

export async function getAllUsersController(_req: Request, res: Response) {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch users",
    });
  }
}

export async function getUserByIdController(req: Request, res: Response) {
  try {
    const user = await getUserById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "User not found",
    });
  }
}

export async function createUserController(req: Request, res: Response) {
  try {
    const validatedData = createUserSchema.parse(req.body);

    const user = await createUser(validatedData);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create user",
    });
  }
}

export async function updateUserController(req: Request, res: Response) {
  try {
    const validatedData = updateUserSchema.parse(req.body);

    const user = await updateUser(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update user",
    });
  }
}