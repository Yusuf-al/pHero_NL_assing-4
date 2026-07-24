import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./modules/users/users.route";
import authRoutes from "./modules/auth/auth.route";
import propertiesRoute from "./modules/properties/properties.route";
import categoryRoute from "./modules/categories/category.route";
import rentalRoute from "./modules/rentalRequest/rent.route";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

app.get("/", async (req: Request, res: Response) => {
  res.json({
    message: "Application is running",
  });
});

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/rent", rentalRoute);

export default app;
