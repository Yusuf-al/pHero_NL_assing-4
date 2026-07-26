import { RequestStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe"; // adjust to your actual stripe client import path
import config from "../../config";
import AppError from "../../errors/AppError";

const paymentSession = async (userId: string, rentRequestId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  // Fetch by `id` only — Prisma's `findUniqueOrThrow` where clause must
  // match an actual unique constraint. Combining `id` with `isPaid`/`status`
  // (neither of which is unique) would throw a Prisma validation error
  // instead of a clean "not found"/"not eligible" message.
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

export const paymentServices = {
  paymentSession,
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
