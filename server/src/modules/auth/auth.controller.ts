import { Request, Response } from "express";
import { loginSchema } from "./auth.validation";
import { loginUser } from "./auth.service";

export async function loginController(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body);

    const result = await loginUser(validatedData);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
}

export async function meController(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "Authenticated user fetched successfully",
    data: (req as any).user,
  });
}