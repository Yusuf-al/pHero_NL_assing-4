import { RequestStatus } from "../../../generated/prisma/client";

export interface IRentalRequestQuery {
  searchTerm?: string; // matches against property title/city
  status?: RequestStatus;
  moveInFrom?: string; // ISO date string
  moveInTo?: string; // ISO date string
  page?: number;
  limit?: number;
  sortBy?: "moveInDate" | "moveOutDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}
