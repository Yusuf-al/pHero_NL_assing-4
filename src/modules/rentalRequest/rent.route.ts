import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/client";
import { rentalController } from "./rent.controller";

const rentalRoute = Router();

rentalRoute.post(
  "/requests/:id",
  auth([UserRole.TENANT]),
  rentalController.createNewRentRequest,
);

rentalRoute.patch(
  "/requests/update/:id",
  auth([UserRole.LANDLORD, UserRole.ADMIN]),
  rentalController.requestStatusUpdate,
);

rentalRoute.get(
  "/requests/all",
  auth([UserRole.ADMIN]),
  rentalController.getAllRentalRequest,
);

export default rentalRoute;
