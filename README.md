# 🎟️ BookMyEvent - Full-Stack Event Booking & Management Platform

**BookMyEvent** is a modern, production-grade MERN (MongoDB, Express, React, Node.js) full-stack web application designed for seamless event discovery, ticket reservation, and event organization management. It incorporates secure **Two-Factor Authentication (2FA) Email OTP verification**, role-based access control (Admin & User), an interactive analytics dashboard, automated Nodemailer HTML notifications, and resilient startup tooling.

---

## 📑 Table of Contents
- [Tech Stack & Technologies Used](#-tech-stack--technologies-used)
- [Key Features](#-key-features)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
- [Project Directory Structure](#-project-directory-structure)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Quick Start Guide](#-quick-start-guide)
- [Default Seed Accounts & Testing](#-default-seed-accounts--testing)
- [Security & Resilience Features](#-security--resilience-features)

---

## 🛠️ Tech Stack & Technologies Used

### Frontend (`/client`)
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `v18.2.0` | Declarative component-based UI library |
| **Vite** | `v5.1.4` | Next-generation ultra-fast frontend build tool and dev server |
| **React Router DOM** | `v6.22.3` | Client-side declarative routing and protected navigation |
| **Tailwind CSS** | `v3.4.1` | Utility-first CSS framework for modern, responsive layouts |
| **Axios** | `v1.6.7` | Promise-based HTTP client with global JWT request interceptors |
| **React Icons** | `v5.0.1` | Comprehensive SVG icon library |
| **Context API** | Built-in | Centralized global authentication and persistent session state |

### Backend (`/server`)
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>=18.x` | Asynchronous event-driven JavaScript runtime environment |
| **Express.js** | `v4.18.2` | RESTful web framework for API routing and middleware pipelines |
| **MongoDB Atlas** | Cloud M0 | Fully managed cloud NoSQL document database |
| **Mongoose** | `v8.2.0` | Object Data Modeling (ODM) with strict schemas and TTL indexes |
| **JSON Web Tokens (JWT)** | `v9.0.2` | Stateless, cryptographically signed user authorization tokens (30d expiry) |
| **Bcrypt.js** | `v2.4.3` | One-way salted cryptographic password hashing (10 salt rounds) |
| **Nodemailer** | `v6.9.11` | Automated SMTP email delivery engine for Gmail |
| **Cors** | `v2.8.5` | Cross-Origin Resource Sharing security configuration |
| **Dotenv** | `v16.4.5` | Zero-dependency environment variable isolation |
| **Nodemon** | `v3.1.0` | Hot-reloading development server utility |

### Root & Tooling
| Tool | Purpose |
| :--- | :--- |
| **Concurrently** | Runs both backend and frontend simultaneously with a single terminal command |
| **Free-Ports Script** (`scripts/free-ports.js`) | Automatic cross-platform port cleanup hook preventing `EADDRINUSE` port crashes |
| **Database Seeder** (`server/seed.js`) | Automated dataset generator for events, users, admin, and test bookings |
| **Postman Collection** (`BookMyEvent_Postman_Collection.json`) | Complete pre-configured API testing suite |

---

## ✨ Key Features

### 1. User Authentication & 2FA OTP Security
- **Email Verification**: When registering a new account, a secure 6-digit numeric OTP is generated and delivered to the user's Gmail inbox.
- **Self-Healing Unverified Flow**: If an unverified user leaves and re-registers, the system updates their credentials and issues a fresh OTP instead of throwing duplicate user errors.
- **Resend OTP Mechanism**: Both registration, login, and booking screens provide one-click "Resend OTP" functionality.
- **Auto-Fill Fallback in Dev**: Displays a helper banner with an auto-fill button if email SMTP is not configured or in development mode.
- **Automatic TTL Expiry**: OTP documents automatically self-destruct in MongoDB after 5 minutes via native TTL indexes.

### 2. Role-Based Access Control (RBAC)
- **User Role**:
  - Browse and search upcoming events with live debounced filtering.
  - View event details, ticket pricing, date, location, and remaining seat count.
  - Request ticket reservations protected by 2FA Email OTP.
  - View personal dashboard with live booking statuses (`pending`, `confirmed`, `cancelled`).
  - Cancel existing reservations with automatic seat restoration.
- **Admin Role**:
  - Dedicated access to the **Admin Dashboard** (`/admin`).
  - Create new events with titles, descriptions, categories, dates, seating limits, prices, and external image URLs.
  - Edit or delete existing events.
  - Approve (`confirm`) or reject (`cancel`) incoming booking requests.
  - Toggle payment verification status (`Paid` / `Not Paid`).
  - Real-time analytics: Total Bookings, Confirmed Clients, Pending Queue, and Total Revenue generated.

### 3. Smart Seat Inventory & Booking Lifecycle
- **Real-Time Seat Guard**: Prevents overbooking by verifying that `availableSeats > 0` before accepting requests.
- **Seat Deduction Logic**: Seats are reserved and deducted from inventory only upon admin confirmation.
- **Seat Restoration**: If a confirmed booking is cancelled by a user or admin, the available seat is immediately returned to inventory.

### 4. Rich HTML Email Notifications (Nodemailer)
- **Account Verification OTP**: Clean card with a bold 6-digit verification code.
- **Booking Verification OTP**: Dedicated OTP to verify and sign off ticket reservations.
- **Immediate Booking Summary**: Dispatched immediately upon user booking submission, featuring Event Title, Date, Venue, Ticket Price, Unique Booking ID, and Status.
- **Admin Confirmation Notification**: Sent when the administrator approves the reservation.

---

## 🔄 System Architecture & Data Flow

```
                      +-----------------------------+
                      |       React + Vite Client   |
                      |  (Tailwind CSS + Context)   |
                      +--------------+--------------+
                                     |
                          Axios HTTP + JWT Bearer
                                     |
                                     v
                      +-----------------------------+
                      |      Express.js Server      |
                      |   (Middleware + Routes)     |
                      +-------+--------------+------+
                              |              |
              Mongoose Schemas|              | Nodemailer SMTP
                              v              v
               +------------------+   +------------------+
               |  MongoDB Atlas   |   |   Google Gmail   |
               | (Users, Events,  |   |   SMTP Service   |
               |  Bookings, OTP)  |   |  (HTML Emails)   |
               +------------------+   +------------------+
```

### Complete Booking Lifecycle:
1. **User requests booking**: Client triggers `POST /api/bookings/send-otp`.
2. **OTP Dispatch**: Server creates OTP in MongoDB with a 5-minute expiry and dispatches code to user's email.
3. **Verification**: User enters OTP; client sends `POST /api/bookings` with `{ eventId, otp }`.
4. **Validation**: Server verifies OTP, checks seat availability, creates a `pending` booking, and immediately emails the booking summary to the user.
5. **Admin Approval**: Admin visits `/admin` and triggers `PUT /api/bookings/:id/confirm`. Server deducts the seat, updates status to `confirmed`, and sends a confirmation email.

---

## 📁 Project Directory Structure

```text
booking-sys/
│
├── client/                              # React Frontend (Vite)
│   ├── public/                          # Static public assets
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx               # Navigation bar with responsive role links
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Auth state, login, register, verify, resend
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx       # Event management & booking approvals
│   │   │   ├── EventDetail.jsx          # Event view & 2FA booking modal
│   │   │   ├── Home.jsx                 # Event browsing, hero search, & catalog
│   │   │   ├── Login.jsx                # User/Admin login & unverified OTP gate
│   │   │   ├── Register.jsx             # Account registration & OTP verification
│   │   │   └── UserDashboard.jsx        # User's ticket bookings & cancellations
│   │   ├── utils/
│   │   │   └── axios.js                 # Axios instance with auth header interceptor
│   │   ├── App.jsx                      # Route definitions & protected routes
│   │   ├── main.jsx                     # Application entry point
│   │   └── index.css                    # Tailwind CSS imports & global styles
│   ├── index.html                       # Single-page HTML container
│   ├── package.json                     # Client dependencies & build scripts
│   ├── tailwind.config.js               # Tailwind CSS theme configuration
│   └── vite.config.js                   # Vite configuration
│
├── server/                              # Node.js + Express Backend
│   ├── controllers/
│   │   ├── authController.js            # Register, login, verifyOTP, resendOTP
│   │   ├── bookingController.js         # Booking requests, approval, cancellation
│   │   └── eventController.js           # Event CRUD operations & search
│   ├── middleware/
│   │   └── auth.js                      # JWT verification & admin guard middleware
│   ├── models/
│   │   ├── Booking.js                   # Booking schema (user, event, status, payment)
│   │   ├── Event.js                     # Event schema (seats, price, date, image)
│   │   ├── OTP.js                       # OTP schema with automatic 5-min TTL index
│   │   └── User.js                      # User schema with unique email & bcrypt hash
│   ├── routes/
│   │   ├── auth.js                      # /api/auth routes
│   │   ├── bookings.js                  # /api/bookings routes
│   │   └── events.js                    # /api/events routes
│   ├── utils/
│   │   └── email.js                     # Nodemailer SMTP setup & HTML email templates
│   ├── .env                             # Environment configuration (secrets)
│   ├── .env.example                     # Example environment template
│   ├── package.json                     # Server dependencies & scripts
│   ├── seed.js                          # Database seeder (dummy events, users, admin)
│   └── server.js                        # Express app initialization & port listener
│
├── scripts/
│   └── free-ports.js                    # Auto-cleans ports 5000 & 5173 before launch
│
├── BookMyEvent_Postman_Collection.json   # Exported Postman API collection
├── SETUP_GUIDE.md                       # Comprehensive step-by-step setup guide
├── README.md                            # Project documentation (this file)
└── package.json                         # Root package with concurrently & predev hooks
```

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user and dispatch 2FA OTP |
| `POST` | `/api/auth/login` | Public | Authenticate user; prompts OTP if unverified |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit OTP and issue JWT access token |
| `POST` | `/api/auth/resend-otp` | Public | Invalidate stale OTP and dispatch fresh code |

### Events (`/api/events`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Public | List all upcoming events with optional `?search=` filter |
| `GET` | `/api/events/:id` | Public | Retrieve single event details |
| `POST` | `/api/events` | Admin | Create a new event |
| `PUT` | `/api/events/:id` | Admin | Update an existing event |
| `DELETE` | `/api/events/:id` | Admin | Delete an event |

### Bookings (`/api/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings/send-otp` | Protected | Dispatch 2FA booking OTP to user's email |
| `POST` | `/api/bookings` | Protected | Verify OTP and submit ticket booking request |
| `GET` | `/api/bookings/my` | Protected | Get user's bookings (or all bookings if Admin) |
| `PUT` | `/api/bookings/:id/confirm`| Admin | Confirm booking, deduct seat, and send confirmation email |
| `DELETE` | `/api/bookings/:id` | Protected | Cancel booking (restores seat if previously confirmed) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (`v18.x` or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)
- Gmail account with a [Google App Password](https://myaccount.google.com/apppasswords)

### 1. Clone & Install Dependencies
From the root directory:
```bash
# Install all dependencies across root, server, and client in one step:
npm run setup
```

### 2. Configure Environment Variables
Open [server/.env](file:///c:/Users/Indranil%20Laha/OneDrive/Desktop/booking-sys/server/.env) and configure:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_gmail_app_password
PORT=5000
```
> **Important**: `EMAIL_PASS` must be a 16-character **Google App Password** (e.g. `abcd efgh ijkl mnop`), not your regular Gmail account password.

### 3. (Optional) Seed the Database
Populate the database with sample events, users, and an admin account:
```bash
cd server
npm run seed
cd ..
```

### 4. Run the Application
Start both backend and frontend concurrently from the root directory:
```bash
npm run dev
```

- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

> 💡 **Built-in Port Safety**: The root `predev` lifecycle hook automatically runs `scripts/free-ports.js` to kill any orphaned processes holding port `5000` or `5173`, preventing `EADDRINUSE` crashes.

---

## 👥 Default Seed Accounts & Testing

When running `npm run seed` in the server directory, the following accounts are pre-created:

| Account | Email | Password | Role | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@bookmyevent.com` | `password123` | `admin` | Full Admin Dashboard & Event Management |
| **Demo User** | `user@bookmyevent.com` | `password123` | `user` | Standard ticket browsing and reservations |

---

## 🛡️ Security & Resilience Features

- **Salted Bcrypt Hashing**: Passwords are never stored in plaintext. They undergo 10 rounds of cryptographic salting.
- **JWT Authorization**: Requests to protected routes require a signed `Authorization: Bearer <token>` header verified on each request.
- **Self-Cleaning MongoDB TTL**: OTP codes expire and are purged automatically by MongoDB after 300 seconds (5 minutes).
- **Email Sanitization**: Google App Passwords automatically have grouping spaces stripped to prevent copy-paste formatting errors.
- **Graceful Port Recovery**: Prevents duplicate server listener crashes through automated port detection and error handling.
- **Role Verification Middleware**: Prevents unauthorized users from accessing admin routes by checking database role claims.
