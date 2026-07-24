import { Router } from "express";
import { propertiesController } from "./properties.controller";

const propertiesRoute = Router();

propertiesRoute.post("/create", propertiesController.createPropertyIntoDB);
propertiesRoute.get("/all", propertiesController.getAllPropertiesFromDB);

export default propertiesRoute;
