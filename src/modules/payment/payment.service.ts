import { RequestStatus } from "../../../generated/prisma/client";
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
          title: true,
          landlord: {
            select: {
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
      userId,
    },

    success_url: `http://localhost:6000/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:6000/payment?success=false`,
  });

  console.log(session);

  return session.url;
};

const handlePaymentWebhook = async (payload: Buffer, signature: string) => {
  const endpointSecret = config.stripe_webhook_secret;

  const event: Stripe.Event = stripe.webhooks.constructEvent(
    payload,
    signature,
    endpointSecret,
  );
  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      const rentalRequestId = session.metadata?.rentalRequestId;
      if (!rentalRequestId) {
        console.error(
          `checkout.session.completed missing rentalRequestId metadata. session id: ${session.id}`,
        );
      }
      break;
    case "payment_method.attached":
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

export const paymentServices = {
  paymentSession,
  handlePaymentWebhook,
};

// import { RequestStatus } from "../../../generated/prisma/client";
// import AppError from "../../errors/AppError";
// import { prisma } from "../../lib/prisma";
// import { stripe } from "../../lib/stripe";

// const paymentSession = async (userId: string, rentRequestId: string) => {
//   const user = await prisma.user.findUniqueOrThrow({
//     where: {
//       id: userId,
//     },
//   });

//   const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
//     where: { id: rentRequestId },
//     include: {
//       property: {
//         select: {
//           title: true,
//           landlord: { select: { name: true, email: true } },
//         },
//       },
//     },
//   });

//   if (rentalRequest.isPaid) {
//     throw AppError.badRequest("This rental request has already been paid.");
//   }

//   if (rentalRequest.status !== RequestStatus.APPROVED) {
//     throw AppError.badRequest("This rental request is not ready for payment.");
//   }

//   let stripeCustomerId = userId;

//   if (!stripeCustomerId) {
//     const customer = await stripe.customers.create({
//       email: user.email,
//       name: user.name,
//       phone: user.phone ?? undefined,
//       metadata: { id: userId },
//     });
//     stripeCustomerId = customer.id;
//     await prisma.user.update({
//       where: { id: userId },
//       data: { stripeCustomerId },
//     });
//   }

//   const session = await stripe.checkout.sessions.create({
//     line_items: [
//       {
//         price_data: {
//           currency: "usd",
//           product_data: {
//             name: rentalRequest.property.title,
//           },
//           unit_amount: rentalRequest.totalPrice * 1000,
//         },
//         quantity: 1,
//       },
//     ],
//     mode: "payment",
//     customer: customer.id,
//     payment_method_types: ["card"],
//     success_url: "http://localhost:6000/payment?success=true",
//     cancel_url: "http://localhost:6000/payment?success=false",
//   });

//   return session.url;
// };

// export const paymentServices = {
//   paymentSession,
// };
