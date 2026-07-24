import { Router } from "express";
import { categoryController } from "./category.controller";

const categoryRoute = Router();

categoryRoute.post("/create", categoryController.createCategoryIntoDB);
categoryRoute.get("/", categoryController.getAllCategoriesFromDB);

export default categoryRoute;
