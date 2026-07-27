# RentNest — API

Backend REST API for a rental property platform supporting **Tenants**, **Landlords**, and **Admins** — property listings, rental requests, reviews, and payments.

## Base URL

```
[https://backend-project-assignment-main.vercel.app/]
```

## Credentials
ADMIN - admin@example.com
PASSWORD - '123456'
LANDLORD - abc2@example.com
PASSWORD - '123456'
TENANT - abc@exaple.com
PASSWORD - '123456'

## Authentication

Protected routes require a JWT sent in the `Authorization` header:

```
Authorization: Cookies
```

Roles: `ADMIN`, `LANDLORD`, `TENANT`

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/login` | Login user, returns JWT access & refresh tokens | Public |
| POST | `/api/auth/refresh-token` | Issue a new access token using a valid refresh token | Public |

### User — `/api/user`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/user/register` | Register a new user (tenant/landlord) | Public |
| GET | `/api/user/me` | Get the current authenticated user's profile | Admin, Landlord, Tenant |
| PUT | `/api/user/my-profile` | Update the current authenticated user's profile | Admin, Landlord, Tenant |

### Properties — `/api/properties`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/properties/landlord/create` | Create a new property listing | Landlord, Admin |
| PUT | `/api/properties/landlord/update/:id [Property_Id]` | Update an existing property listing | Landlord, Admin |
| DELETE | `/api/properties/landlord/delete/:id[Property_Id]` | Delete a property listing | Landlord, Admin |
| GET | `/api/properties/landlord/requests` | Get rental requests submitted for the landlord's properties | Landlord |

### Categories — `/api/categories`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/categories/create` | Create a new property category | Public |
| GET | `/api/categories` | Get all property categories | Public |

### Rental Requests — `/api/rent`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/rent/requests/:id [Property_Id]` | Create a new rental request for a property | Tenant |
| PATCH | `/api/rent/requests/update/:id [rental_request_id]` | Update the status of a rental request (approve/reject) | Landlord, Admin |
| GET | `/api/rent/requests/all` | Get all rental requests in the system | Admin |

### Admin — `/api/admin`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/admin/properties` | Get all properties in the system | Admin |
| GET | `/api/admin/users` | Get all registered users | Admin |
| GET | `/api/admin/rental-requests` | Get all rental requests in the system | Admin |
| PATCH | `/api/admin/update/status/:id [User_Id]` | Update a user's account status | Admin |
| PATCH | `/api/admin/update/role/:id [User_Id]` | Update a user's role | Admin |

### Reviews — `/api/review`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/review/create/:id[Property_Id]` | Create a review for a property | Tenant |

### Payment — `/api/payment`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/payment/:id[rental_request_id]/create-payment-session` | Create a payment session for a rental | Admin, Landlord, Tenant |
| POST | `/api/payment/webhook` | Handle incoming payment gateway webhook events | Public (webhook) |

## Route Modules

```
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/rent", rentalRoute);
app.use("/api/admin", adminRoute);
app.use("/api/review", reviewRoute);
app.use("/api/payment", paymentRoute);
```

## Roles & Access Summary

| Role | Can do |
|---|---|
| **Tenant** | Register/login, manage own profile, create rental requests, create reviews, make payments |
| **Landlord** | Everything a Tenant can (profile-wise), manage own properties, view/update rental requests on own properties, make payments |
| **Admin** | Full access — manage all properties, users, rental requests, and user roles/status |

## Notes
- `POST /api/payment/webhook` is called by the payment gateway, not by client apps — exclude it from auth middleware.
