import {
  PaymentMethod,
  PaymentStatus,
  RequestStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe"; // adjust to your actual stripe client import path
import config from "../../config";
import AppError from "../../errors/AppError";
import { Stripe } from "stripe";

const paymentSession = async (userId: string, rentRequestId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
    where: {
      id: rentRequestId,
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (rentalRequest.isPaid) {
    throw AppError.badRequest("This rental request has already been paid.");
  }

  let stripeCustomerId = userId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      phone: user.phone ?? undefined, // avoid passing null/undefined via `as string` cast
      metadata: {
        id: userId,
      },
    });

    stripeCustomerId = customer.id;

    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { stripeCustomerId },
    // });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: rentalRequest.property.title,
          },

          unit_amount: Math.round(rentalRequest.totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_method_types: ["card"],

    metadata: {
      rentalRequestId: rentRequestId,
      tenantId: userId,
      propertyId: rentalRequest.propertyId,
      landlordId: rentalRequest.property.landlord.id,
    },

    success_url: `http://localhost:6000/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:6000/payment?success=false`,
  });

  return session.url;
};

const handlePaymentWebhook = async (payload: Buffer, signature: string) => {
  const endpointSecret = config.stripe_webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    throw AppError.badRequest(
      `Webhook signature verification failed: ${(err as Error).message}`,
    );
  }
  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      console.log("✅ checkout.session.completed received:", event.id);
      const session = event.data.object as Stripe.Checkout.Session;

      const rentalRequestId = session.metadata?.rentalRequestId;
      const tenantId = session.metadata?.tenantId;
      const propertyId = session.metadata?.propertyId;
      const landlordId = session.metadata?.landlordId;

      if (!rentalRequestId || !tenantId || !propertyId || !landlordId) {
        console.error(
          `checkout.session.completed missing required metadata. session id: ${session.id}`,
        );
        break;
      }

      if (session.payment_status === "paid") {
        const rawMethod = session.payment_method_types?.[0] ?? "card";
        const paymentMethod = rawMethod.toUpperCase() as PaymentMethod;
        await prisma.$transaction([
          prisma.rentalRequest.update({
            where: { id: rentalRequestId },
            data: { isPaid: true, status: RequestStatus.APPROVED },
          }),
          prisma.payment.create({
            data: {
              tenantId,
              transactionId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : (session.payment_intent?.id ?? session.id),
              status: PaymentStatus.PAID,
              propertyId,
              landlordId,

              amount: Number(session.amount_total) / 100,
              rentalRequestId,
              paymentMethod: paymentMethod,

              paymentDate: new Date(),
            },
          }),
        ]);
      }

      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(
        "payment_intent.succeeded — metadata:",
        paymentIntent.metadata,
      );
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const rentalRequestId = session.metadata?.rentalRequestId;

      if (rentalRequestId) {
        await prisma.rentalRequest.update({
          where: { id: rentalRequestId },
          data: { isPaid: true, status: RequestStatus.APPROVED },
        });
      }

      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const rentalRequestId = session.metadata?.rentalRequestId;

      if (rentalRequestId) {
        console.warn(
          `Async payment failed for rentalRequestId: ${rentalRequestId}`,
        );
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.warn(
        `PaymentIntent failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message}`,
      );
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { receive: true };
};

export const paymentServices = {
  paymentSession,
  handlePaymentWebhook,
};
