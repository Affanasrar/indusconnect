import { Request, Response } from "express";
import {
  getAccommodationDropdowns,
  getCurrentProfile,
  getDashboardCards,
  getFinanceDropdowns,
  getFormOptions,
  getFrontendBootstrap,
  getRoleMenu,
  getRolePermissions,
  getTransportDropdowns,
  getUserDropdowns,
} from "./frontendSupport.service";

export async function getFrontendBootstrapController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const bootstrap = await getFrontendBootstrap(currentUser);

    return res.status(200).json({
      success: true,
      message: "Frontend bootstrap data fetched successfully",
      data: bootstrap,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch frontend bootstrap data",
    });
  }
}

export async function getCurrentProfileController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const profile = await getCurrentProfile(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Current user profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Profile not found",
    });
  }
}

export async function getRoleMenuController(req: Request, res: Response) {
  const currentUser = (req as any).user;

  return res.status(200).json({
    success: true,
    message: "Role menu fetched successfully",
    data: getRoleMenu(currentUser.role),
  });
}

export async function getRolePermissionsController(
  req: Request,
  res: Response
) {
  const currentUser = (req as any).user;

  return res.status(200).json({
    success: true,
    message: "Role permissions fetched successfully",
    data: getRolePermissions(currentUser.role),
  });
}

export async function getFormOptionsController(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "Form options fetched successfully",
    data: getFormOptions(),
  });
}

export async function getDashboardCardsController(req: Request, res: Response) {
  const currentUser = (req as any).user;

  return res.status(200).json({
    success: true,
    message: "Dashboard cards fetched successfully",
    data: getDashboardCards(currentUser.role),
  });
}

export async function getUserDropdownsController(_req: Request, res: Response) {
  try {
    const dropdowns = await getUserDropdowns();

    return res.status(200).json({
      success: true,
      message: "User dropdowns fetched successfully",
      data: dropdowns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch user dropdowns",
    });
  }
}

export async function getTransportDropdownsController(
  _req: Request,
  res: Response
) {
  try {
    const dropdowns = await getTransportDropdowns();

    return res.status(200).json({
      success: true,
      message: "Transport dropdowns fetched successfully",
      data: dropdowns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch transport dropdowns",
    });
  }
}

export async function getAccommodationDropdownsController(
  _req: Request,
  res: Response
) {
  try {
    const dropdowns = await getAccommodationDropdowns();

    return res.status(200).json({
      success: true,
      message: "Accommodation dropdowns fetched successfully",
      data: dropdowns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch accommodation dropdowns",
    });
  }
}

export async function getFinanceDropdownsController(
  _req: Request,
  res: Response
) {
  try {
    const dropdowns = await getFinanceDropdowns();

    return res.status(200).json({
      success: true,
      message: "Finance dropdowns fetched successfully",
      data: dropdowns,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch finance dropdowns",
    });
  }
}