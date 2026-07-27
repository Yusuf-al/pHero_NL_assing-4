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
import paymentRoute from "./modules/payment/payment.route";
import config from "./config";
import { stripe } from "./lib/stripe";

const app: Application = express();
const endpointSecret = config.stripe_webhook_secret;

// app.post(
//   "/api/payment/webhook",
//   express.raw({ type: "application/json" }),
//   (req: Request, res: Response) => {
//     let event = req.body;

//     console.log(event, "body");
//     console.log(req.headers, "headers");

//     if (endpointSecret) {
//       const signature = req.headers["stripe-signature"]!;

//       try {
//         event = stripe.webhooks.constructEvent(
//           req.body,
//           signature,
//           endpointSecret,
//         );
//       } catch (error: any) {
//         console.log(`⚠️ Webhook signature verification failed.`, error.message);
//         return response.sendStatus(400);
//       }
//     }

//     console.log("event after try", event);

//     // Handle the event
//     switch (event.type) {
//       case "payment_intent.succeeded":
//         const paymentIntent = event.data.object;
//         // Then define and call a method to handle the successful payment intent.
//         // handlePaymentIntentSucceeded(paymentIntent);
//         break;
//       case "payment_method.attached":
//         const paymentMethod = event.data.object;
//         // Then define and call a method to handle the successful attachment of a PaymentMethod.
//         // handlePaymentMethodAttached(paymentMethod);
//         break;
//       // ... handle other event types
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }

//     response.json({ received: true });
//   },
// );

app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

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
app.use("/api/payment", paymentRoute);

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
