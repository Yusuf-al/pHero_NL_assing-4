import express, {
  Application,
  NextFunction,
  Request,
  response,
  Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./modules/users/users.route";
import authRoutes from "./modules/auth/auth.route";
import propertiesRoute from "./modules/properties/properties.route";
import categoryRoute from "./modules/categories/category.route";
import rentalRoute from "./modules/rentalRequest/rent.route";
import adminRoute from "./modules/admin/admin.route";
import reviewRoute from "./modules/reviews/review.route";
import { sendRespone } from "./utils/sendResponse";
import httpStatus from "http-status";
import { globalErrorHandler } from "./middleware/globalErrorHandler";

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
app.use("/api/admin", adminRoute);
app.use("/api/review", reviewRoute);

app.use((req: Request, res: Response) => {
  sendRespone(res, {
    statusCode: 404,
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use(globalErrorHandler);

export default app;
