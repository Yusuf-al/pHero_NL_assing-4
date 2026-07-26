/*
  Warnings:

  - Added the required column `totalPrice` to the `rental_requests` table without a default value. This is not possible if the table is not empty.
  - Made the column `moveInDate` on table `rental_requests` required. This step will fail if there are existing NULL values in that column.
  - Made the column `moveOutDate` on table `rental_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "rental_requests" ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "moveInDate" SET NOT NULL,
ALTER COLUMN "moveOutDate" SET NOT NULL;
