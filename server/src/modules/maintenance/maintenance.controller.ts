import { Request, Response } from "express";
import {
  completeHousekeepingTaskSchema,
  createHousekeepingTaskSchema,
  createVehicleMaintenanceTaskSchema,
  resolveTaskSchema,
  updateHousekeepingTaskSchema,
  updateVehicleMaintenanceTaskSchema,
} from "./maintenance.validation";
import {
  cancelHousekeepingTask,
  cancelVehicleMaintenanceTask,
  completeHousekeepingTask,
  createHousekeepingTask,
  createHousekeepingTaskAfterCheckout,
  createVehicleMaintenanceTask,
  getAllHousekeepingTasks,
  getAllVehicleMaintenanceTasks,
  getHousekeepingTaskById,
  getOpenVehicleMaintenanceTasks,
  getPendingHousekeepingTasks,
  getVehicleMaintenanceTaskById,
  resolveVehicleMaintenanceTask,
  startHousekeepingTask,
  startVehicleMaintenanceTask,
  updateHousekeepingTask,
  updateVehicleMaintenanceTask,
} from "./maintenance.service";

export async function createVehicleMaintenanceTaskController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createVehicleMaintenanceTaskSchema.parse(req.body);

    const task = await createVehicleMaintenanceTask(
      currentUser?.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Vehicle maintenance task created successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create vehicle maintenance task",
    });
  }
}

export async function getAllVehicleMaintenanceTasksController(
  _req: Request,
  res: Response
) {
  try {
    const tasks = await getAllVehicleMaintenanceTasks();

    return res.status(200).json({
      success: true,
      message: "Vehicle maintenance tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch vehicle maintenance tasks",
    });
  }
}

export async function getOpenVehicleMaintenanceTasksController(
  _req: Request,
  res: Response
) {
  try {
    const tasks = await getOpenVehicleMaintenanceTasks();

    return res.status(200).json({
      success: true,
      message: "Open vehicle maintenance tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch open vehicle maintenance tasks",
    });
  }
}

export async function getVehicleMaintenanceTaskByIdController(
  req: Request,
  res: Response
) {
  try {
    const task = await getVehicleMaintenanceTaskById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Vehicle maintenance task fetched successfully",
      data: task,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Vehicle maintenance task not found",
    });
  }
}

export async function updateVehicleMaintenanceTaskController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = updateVehicleMaintenanceTaskSchema.parse(req.body);
    const task = await updateVehicleMaintenanceTask(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Vehicle maintenance task updated successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update vehicle maintenance task",
    });
  }
}

export async function startVehicleMaintenanceTaskController(
  req: Request,
  res: Response
) {
  try {
    const task = await startVehicleMaintenanceTask(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Vehicle maintenance task started successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to start vehicle maintenance task",
    });
  }
}

export async function resolveVehicleMaintenanceTaskController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = resolveTaskSchema.parse(req.body);

    const task = await resolveVehicleMaintenanceTask(
      String(req.params.id),
      validatedData.resolutionNotes
    );

    return res.status(200).json({
      success: true,
      message: "Vehicle maintenance task resolved successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to resolve vehicle maintenance task",
    });
  }
}

export async function cancelVehicleMaintenanceTaskController(
  req: Request,
  res: Response
) {
  try {
    const task = await cancelVehicleMaintenanceTask(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Vehicle maintenance task cancelled successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel vehicle maintenance task",
    });
  }
}

export async function createHousekeepingTaskController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createHousekeepingTaskSchema.parse(req.body);

    const task = await createHousekeepingTask(
      currentUser?.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Housekeeping task created successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create housekeeping task",
    });
  }
}

export async function createHousekeepingTaskAfterCheckoutController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const task = await createHousekeepingTaskAfterCheckout(
      String(req.params.reservationId),
      currentUser?.userId
    );

    return res.status(201).json({
      success: true,
      message: "Housekeeping task created after checkout successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create housekeeping task after checkout",
    });
  }
}

export async function getAllHousekeepingTasksController(
  _req: Request,
  res: Response
) {
  try {
    const tasks = await getAllHousekeepingTasks();

    return res.status(200).json({
      success: true,
      message: "Housekeeping tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch housekeeping tasks",
    });
  }
}

export async function getPendingHousekeepingTasksController(
  _req: Request,
  res: Response
) {
  try {
    const tasks = await getPendingHousekeepingTasks();

    return res.status(200).json({
      success: true,
      message: "Pending housekeeping tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending housekeeping tasks",
    });
  }
}

export async function getHousekeepingTaskByIdController(
  req: Request,
  res: Response
) {
  try {
    const task = await getHousekeepingTaskById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Housekeeping task fetched successfully",
      data: task,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Housekeeping task not found",
    });
  }
}

export async function updateHousekeepingTaskController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = updateHousekeepingTaskSchema.parse(req.body);
    const task = await updateHousekeepingTask(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Housekeeping task updated successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update housekeeping task",
    });
  }
}

export async function startHousekeepingTaskController(
  req: Request,
  res: Response
) {
  try {
    const task = await startHousekeepingTask(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Housekeeping task started successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to start housekeeping task",
    });
  }
}

export async function completeHousekeepingTaskController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = completeHousekeepingTaskSchema.parse(req.body);

    const task = await completeHousekeepingTask(
      String(req.params.id),
      validatedData.completionNotes
    );

    return res.status(200).json({
      success: true,
      message: "Housekeeping task completed successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to complete housekeeping task",
    });
  }
}

export async function cancelHousekeepingTaskController(
  req: Request,
  res: Response
) {
  try {
    const task = await cancelHousekeepingTask(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Housekeeping task cancelled successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel housekeeping task",
    });
  }
}