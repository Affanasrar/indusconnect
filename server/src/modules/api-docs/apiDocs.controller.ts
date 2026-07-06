import { Request, Response } from "express";
import { apiDocs } from "./apiDocs.data";

export async function getApiDocsController(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "API documentation fetched successfully",
    data: apiDocs,
  });
}

export async function getApiModulesController(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "API modules fetched successfully",
    data: apiDocs.modules,
  });
}

export async function getApiModuleByNameController(req: Request, res: Response) {
  const moduleNameParam = req.params.moduleName;
  const moduleName = Array.isArray(moduleNameParam)
    ? moduleNameParam[0]
    : moduleNameParam;

  if (!moduleName) {
    return res.status(400).json({
      success: false,
      message: "Invalid API module name",
    });
  }

  const normalizedModuleName = moduleName.toLowerCase();

  const module = apiDocs.modules.find(
    (item) => item.name.toLowerCase().replace(/\s+/g, "-") === normalizedModuleName
  );

  if (!module) {
    return res.status(404).json({
      success: false,
      message: "API module not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "API module fetched successfully",
    data: module,
  });
}