import { Router } from "express";
import {
  getApiDocsController,
  getApiModuleByNameController,
  getApiModulesController,
} from "./apiDocs.controller";

const router = Router();

router.get("/", getApiDocsController);
router.get("/modules", getApiModulesController);
router.get("/modules/:moduleName", getApiModuleByNameController);

export default router;