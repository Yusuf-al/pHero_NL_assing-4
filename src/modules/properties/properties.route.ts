import { Router } from "express";
import { propertiesController } from "./properties.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";

const propertiesRoute = Router();

propertiesRoute.post("/create", propertiesController.createPropertyIntoDB);
propertiesRoute.post(
  "/landlord/create",
  auth([UserRole.LANDLORD, UserRole.ADMIN]),
  propertiesController.createPropertyIntoDB,
);

propertiesRoute.put(
  "/landlord/update/:id",
  auth([UserRole.LANDLORD, UserRole.ADMIN]),
  propertiesController.updatePropertyIntoDB,
);

propertiesRoute.delete(
  "/landlord/delete/:id",
  auth([UserRole.LANDLORD, UserRole.ADMIN]),
  propertiesController.deletePropertyFromDB,
);

propertiesRoute.get(
  "/landlord/requests",
  auth([UserRole.LANDLORD]),
  propertiesController.userRentalRequest,
);

propertiesRoute.get("/all", propertiesController.getAllPropertiesFromDB);

export default propertiesRoute;
