import { PropertyStatus } from "../../../generated/prisma/client";

export interface IPropertyQuery {
  searchTerm?: string;
  city?: string;
  area?: string;
  categoryId?: string;
  status?: PropertyStatus;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  page?: number;
  limit?: number;
  sortBy?: "rent" | "createdAt" | "bedrooms";
  sortOrder?: "asc" | "desc";
}
