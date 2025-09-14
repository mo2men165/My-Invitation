# My Invitation - Digital Invitation Platform

<div align="center">

![My Invitation Logo](client/public/logo.png)

**Advanced Platform for Creating and Managing Premium Digital Invitations**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.12-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security](#security)
- [Monitoring & Logging](#monitoring--logging)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**My Invitation** is a comprehensive digital invitation management platform designed specifically for the Saudi Arabian market, tailored to meet the needs of various events such as weddings, graduations, and birthdays. The platform provides an advanced user experience with intelligent guest management and attendance tracking capabilities.

### 🎨 Design & Interface
- Fully Arabic user interface with RTL support
- Responsive design that works on all devices
- Elegant color scheme inspired by gold and black
- Smooth and sophisticated user experience

### 🏢 Target Audience
- Private event organizers (weddings, graduations, birthdays)
- Event management companies
- Individuals seeking professional invitation solutions

## ✨ Key Features

### 🎨 Design Management
- **500+ exclusive designs** available for selection
- **3 main categories**: Weddings, Graduations, Birthdays
- **Customizable designs** according to client requirements
- **Live preview** of designs before selection
- **Comparison system** for different designs

### 📦 Service Packages

#### 🛡️ Classic Package
- Invitation card only (image)
- QR code and serial number for each card
- WhatsApp delivery by the client
- Accurate attendance statistics
- Reminder one day before the event

#### 👑 Premium Package
- Invitation card + entry card
- Ability to increase number of cards
- Guest name and phone registration
- Custom design as requested
- Comprehensive statistics before and after the event
- Thank you message for attendees

#### 💎 VIP Package
- Private WhatsApp group for technical support
- Support for Arabic and English languages
- Custom WhatsApp bot named after the event
- Special 3D invitation video
- Supervisor for QR code reading
- Automatic reminder messages

### 🛒 Shopping Cart & Payment System
- **Smart cart** for saving selected designs
- **Automatic calculation** of prices with discounts
- **Additional services** available for selection
- **Secure payment** with instant confirmation
- **Detailed invoices** in Arabic

### 👥 Guest Management
- **Comprehensive guest list** with ability to add companions
- **Real-time attendance tracking**
- **WhatsApp reminders** sending
- **Detailed statistics** about attendance and interaction
- **Data export** in various formats

### 📍 Location Services
- **Google Maps integration** for event location identification
- **Support for 6 major Saudi cities**
- **Precise location identification** with coordinates
- **Distance calculation** and transportation

### 🔐 Security & Protection
- **Advanced authentication** with JWT
- **Complete encryption** of all sensitive data
- **Protection against** common security attacks
- **Comprehensive logging** of all operations
- **Automatic backups** of data

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.4.6** - Advanced React framework
- **React 19.1.0** - User interface library
- **TypeScript 5.0** - Programming language with type support
- **Tailwind CSS 4.1.12** - CSS framework
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zod** - Data validation
- **Redux Toolkit** - State management
- **Axios** - HTTP requests

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js 5.1.0** - Web framework
- **TypeScript 5.9.2** - Programming language
- **MongoDB 8.17.1** - Database
- **Mongoose** - ODM library for MongoDB
- **JWT** - User authentication
- **bcryptjs** - Password encryption
- **Redis** - Caching
- **Winston** - Logging system

### External Services
- **Auth0** - Authentication management
- **Google Maps API** - Maps services
- **Cloudinary** - Image management
- **MailerSend** - Email sending
- **Sentry** - Error monitoring
- **Railway** - Application hosting

## 📁 Project Structure

```
my-invitation/
├── client/                          # Next.js application (Frontend)
│   ├── src/
│   │   ├── app/                     # Application pages
│   │   │   ├── about/              # About page
│   │   │   ├── admin/              # Admin dashboard
│   │   │   ├── api/                # API routes
│   │   │   ├── cart/               # Cart page
│   │   │   ├── compare/            # Compare page
│   │   │   ├── contact/            # Contact page
│   │   │   ├── dashboard/          # User dashboard
│   │   │   ├── events/             # Events page
│   │   │   ├── login/              # Login page
│   │   │   ├── packages/           # Packages page
│   │   │   ├── payment/            # Payment page
│   │   │   ├── register/           # Register page
│   │   │   ├── settings/           # Settings page
│   │   │   └── wishlist/           # Wishlist page
│   │   ├── components/             # React components
│   │   │   ├── about/              # About page components
│   │   │   ├── account/            # Account components
│   │   │   ├── admin/              # Admin components
│   │   │   ├── auth/               # Authentication components
│   │   │   ├── cart/               # Cart components
│   │   │   ├── compare/            # Compare components
│   │   │   ├── contact/            # Contact components
│   │   │   ├── dashboard/          # Dashboard components
│   │   │   ├── Home/               # Home page components
│   │   │   ├── layout/             # Layout components
│   │   │   ├── packages/           # Packages components
│   │   │   ├── ui/                 # UI components
│   │   │   └── wishlist/           # Wishlist components
│   │   ├── constants/              # Constants and data
│   │   │   ├── additionalServices.ts
│   │   │   ├── homeData.ts
│   │   │   ├── invitationDesigns.ts
│   │   │   ├── packageData.ts
│   │   │   └── ...
│   │   ├── hooks/                  # Custom React Hooks
│   │   ├── lib/                    # Helper libraries
│   │   ├── providers/              # Context providers
│   │   ├── store/                  # State management (Redux)
│   │   ├── types/                  # TypeScript definitions
│   │   └── utils/                  # Helper functions
│   ├── public/                     # Static files
│   │   ├── birthday invites/       # Birthday invitation images
│   │   ├── graduation invites/     # Graduation invitation images
│   │   ├── wedding invites/        # Wedding invitation images
│   │   └── ...
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
├── server/                         # Express.js application (Backend)
│   ├── src/
│   │   ├── config/                 # Application configuration
│   │   │   ├── database.ts         # Database configuration
│   │   │   ├── logger.ts           # Logging system configuration
│   │   │   └── redis.ts            # Redis configuration
│   │   ├── middleware/             # Middleware
│   │   │   ├── auth.ts             # Authentication middleware
│   │   │   ├── errorHandler.ts     # Error handler
│   │   │   └── rateLimiter.ts      # Rate limiting
│   │   ├── models/                 # Database models
│   │   │   ├── Event.ts            # Event model
│   │   │   └── User.ts             # User model
│   │   ├── routes/                 # API routes
│   │   │   ├── auth.ts             # Authentication routes
│   │   │   ├── cart.ts             # Cart routes
│   │   │   ├── event.ts            # Event routes
│   │   │   ├── payment.ts          # Payment routes
│   │   │   └── ...
│   │   ├── services/               # Business services
│   │   │   ├── emailService.ts     # Email service
│   │   │   ├── paymentService.ts   # Payment service
│   │   │   ├── eventStatusService.ts # Event status service
│   │   │   └── ...
│   │   ├── utils/                  # Helper functions
│   │   ├── app.ts                  # Application setup
│   │   └── server.ts               # Server startup
│   ├── dist/                       # Compiled JavaScript files
│   ├── logs/                       # Log files
│   ├── package.json
│   └── tsconfig.json
├── package.json                    # Main project file
└── README.md
```

## ⚙️ Prerequisites

### System Requirements
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **MongoDB** 6.0 or higher
- **Redis** 6.0 or higher

### Development Requirements
- **Git** for version control
- **VS Code** (recommended) with TypeScript extensions
- **MongoDB Compass** for database management
- **Redis Desktop Manager** for Redis management

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/my-invitation.git
cd my-invitation
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or install each project separately
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Environment Variables Setup

#### Server `.env` file (server/.env)
```env
# Database settings
MONGODB_URI=mongodb://localhost:27017/my-invitation
REDIS_URL=redis://localhost:6379

# JWT settings
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Auth0 settings
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Email settings
MAILERSEND_API_KEY=your-mailersend-api-key
FROM_EMAIL=noreply@myinvitation.com
FROM_NAME=My Invitation

# Google Maps settings
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Cloudinary settings
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Sentry settings
SENTRY_DSN=your-sentry-dsn

# Server settings
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Client `.env.local` file (client/.env.local)
```env
# Auth0 settings
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# API settings
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Sentry settings
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 4. Database Setup
```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Create database (will be created automatically on first run)
```

## 🏃‍♂️ Running the Project

### Development Mode
```bash
# Run both server and client together
npm run dev

# Or run each project separately
# Server
cd server && npm run dev

# Client
cd client && npm run dev
```

### Production Mode
```bash
# Build the project
cd client && npm run build
cd ../server && npm run build

# Run production
cd server && npm start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Server**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🔌 API Documentation

### User Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
```

### Event Management
```http
GET /api/events                    # Get user events
GET /api/events/:id               # Get specific event
POST /api/events/:id/guests       # Add guest
PATCH /api/events/:id/guests/:guestId # Update guest data
DELETE /api/events/:id/guests/:guestId # Delete guest
POST /api/events/:id/guests/confirm # Confirm guest list (VIP)
```

### Cart Management
```http
GET /api/cart                     # Get cart contents
POST /api/cart/add                # Add item to cart
PATCH /api/cart/:id               # Update cart item
DELETE /api/cart/:id              # Remove item from cart
DELETE /api/cart/clear            # Clear entire cart
```

### Payments
```http
GET /api/payment/summary          # Payment summary
POST /api/payment/process         # Process successful payment
POST /api/payment/failed          # Handle payment failure
```

### Admin Dashboard
```http
GET /api/admin/events             # Get all events
PATCH /api/admin/events/:id/approve # Approve event
PATCH /api/admin/events/:id/reject # Reject event
GET /api/admin/stats              # System statistics
```

## 🗄️ Database Schema

### User Model
```typescript
interface IUser {
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  lastLogin?: Date;
  cart: ICartItem[];
  wishlist: IWishlistItem[];
  compareList: ICompareItem[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Event Model
```typescript
interface IEvent {
  userId: ObjectId;
  designId: ObjectId;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    inviteCount: number;
    eventDate: Date;
    startTime: string;
    endTime: string;
    invitationText: string;
    hostName: string;
    eventLocation: string;
    additionalCards: number;
    gateSupervisors: number;
    fastDelivery: boolean;
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity?: string;
  };
  totalPrice: number;
  status: 'upcoming' | 'cancelled' | 'done';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  guests: IGuest[];
  paymentCompletedAt: Date;
  guestListConfirmed: {
    isConfirmed: boolean;
    confirmedAt?: Date;
    confirmedBy?: ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔒 Security

### Data Protection
- **Password encryption** using bcryptjs
- **JWT tokens** for authentication
- **Rate limiting** to prevent attacks
- **CORS** configured precisely
- **Helmet** for HTTP header protection

### Data Validation
- **Zod** for data validation
- **Mongoose validation** at database level
- **Input sanitization** for cleaning inputs

### Monitoring
- **Sentry** for error monitoring
- **Winston** for operation logging
- **Health checks** for system monitoring

## 📊 Monitoring & Logging

### Logging System
- **Winston** for operation logging
- **Different levels**: error, warn, info, debug
- **Separate logging**: error.log, combined.log
- **JSON format** for automated analysis

### Error Monitoring
- **Sentry** for real-time error monitoring
- **Performance tracking** and measurement
- **Automatic alerts** for critical errors

### System Statistics
- **Number of registered users**
- **Number of events created**
- **Attendance rate** for events
- **Monthly system revenue**

## 🧪 Testing

### Unit Testing
```bash
# Test server
cd server && npm test

# Test client
cd client && npm test
```

### Integration Testing
```bash
# Test API
npm run test:api

# Test UI
npm run test:e2e
```

## 🚀 Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy project
railway up
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
