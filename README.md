# ShopMe - Multi-Vendor E-Commerce Platform

<div align="center">

A modern, full-featured multi-vendor e-commerce platform built with Next.js 15 and React 19.

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Documentation](#documentation)

</div>

---

## 📋 About The Project

**ShopMe** is a comprehensive multi-vendor e-commerce platform that enables multiple sellers to manage their own stores while providing customers with a unified shopping experience. The platform features robust store management, secure payment processing, real-time inventory tracking, and a complete order fulfillment system.

### What It Does

- **For Customers**: Browse products from multiple stores, manage shopping cart, secure checkout with multiple payment options, rate and review purchases
- **For Store Owners**: Create and manage stores, list products, track inventory, process orders, view analytics
- **For Admins**: Approve stores, manage users, oversee platform content (categories, brands), monitor system-wide analytics

### Built For

- Entrepreneurs wanting to start an online store without building from scratch
- Marketplace operators managing multiple vendors
- Businesses needing a scalable e-commerce solution

---

## ⚡ Quick Start for Team Members

**New to the project? Follow these 4 simple steps:**

```bash
# 1. Clone the repository
git clone <repository-url>
cd shopme

# 2. Install dependencies (Prisma Client auto-generates)
npm install

# 3. Create .env file with shared credentials (get from team lead)
# Copy the credentials into a new .env file in the root directory

# 4. Start development server
npm run dev
```

**That's it!** Open `http://localhost:3000` in your browser.

> **Note**: Make sure you have the shared `public/uploads/` folder synced to see product/store images.

---

## ✨ Features

### 👤 Customer Features

- **Product Browsing & Search**
  - Browse products by category and brand
  - Advanced search functionality
  - Product filtering and sorting
  - Detailed product pages with image galleries

- **Shopping Cart**
  - Add/remove/update items
  - Cart persistence across sessions
  - Real-time stock validation
  - Automatic cart synchronization

- **Checkout & Payment**
  - Multiple payment methods (Cash on Delivery, Stripe)
  - Secure address management
  - Voucher support
  - Order splitting by vendor

- **Order Management**
  - Order history and tracking
  - Real-time status updates (Placed → Processing → Shipped → Delivered)
  - Order details and invoice

- **Product Reviews**
  - Rate products (1-5 stars)
  - Write detailed reviews
  - View ratings from other buyers

### 🏪 Store Owner Features

- **Store Registration & Management**
  - Easy store setup with admin approval
  - Store profile customization
  - Logo upload and branding
  - Store active/inactive toggle

- **Product Management**
  - Add/edit/delete products
  - Multiple image uploads
  - Category and brand assignment
  - Real-time inventory tracking
  - Product active/inactive status

- **Order Processing**
  - View and manage store orders
  - Update order status
  - Access customer information
  - Track order fulfillment

- **Analytics Dashboard**
  - Revenue statistics
  - Order metrics
  - Performance charts

### 👨‍💼 Admin Features

- **Store Approval System**
  - Review store applications
  - Approve/reject stores
  - Automatic role assignment on approval
  - Store status management

- **User Management**
  - View all users
  - Filter by role
  - Activate/deactivate accounts
  - View user activity

- **Content Management**
  - Manage product categories
  - Manage brands (with logos)
  - Create and manage vouchers
  - System-wide product oversight

- **Platform Analytics**
  - Dashboard with system-wide metrics
  - User, store, and order statistics
  - Revenue tracking

### 🔧 Technical Features

- **Authentication & Security**
  - Email/password authentication with NextAuth.js
  - JWT-based sessions
  - Email verification (6-digit code)
  - Bcrypt password hashing
  - Role-based access control

- **Email System**
  - Automated email notifications
  - Background job processing with Inngest
  - Order confirmations
  - Account verification

- **Payment Integration**
  - Stripe payment gateway
  - Webhook-based payment confirmation
  - COD (Cash on Delivery) support
  - Secure payment intent handling

- **State Management**
  - Redux Toolkit for global state
  - Cart synchronization provider
  - Real-time updates

- **File Storage**
  - Local file storage system
  - Image upload for products, stores, and brands
  - Organized in `/public/uploads/`

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: Redux Toolkit
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: NextAuth.js
- **Password Hashing**: Bcrypt

### Integrations
- **Payment**: Stripe
- **Email**: Nodemailer (Gmail SMTP)
- **Background Jobs**: Inngest
- **File Storage**: Local filesystem

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: version 18.x or higher
- **npm** or **yarn**: Latest version

### External Services

The team shares access to:
- **Neon Database**: Shared PostgreSQL database
- **Stripe Account**: For payment processing (shared keys)
- **Gmail Account**: For sending emails (shared credentials)

> **Note**: All service credentials are provided in the shared `.env` file. No individual account setup is needed.

---

## 🛠️ Installation

> **For Team Members**: This is a simplified setup for private team development with shared credentials.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shopme
```

### 2. Install Dependencies

```bash
npm install
```

This will automatically generate the Prisma Client via the postinstall script.

### 3. Environment Setup

Create a `.env` file in the root directory with the shared team credentials:

```env
# Database (PostgreSQL/Neon)
DATABASE_URL="<shared-neon-database-url>"
DIRECT_URL="<shared-neon-database-url>"

# NextAuth.js
NEXTAUTH_SECRET="<shared-nextauth-secret>"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="<shared-stripe-secret-key>"
STRIPE_WEBHOOK_SECRET="<shared-stripe-webhook-secret>"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="<shared-stripe-public-key>"

# Email (Gmail)
GMAIL_USER="<shared-gmail-address>"
GMAIL_APP_PASSWORD="<shared-gmail-app-password>"

# Email Verification
JWT_VERIFICATION_SECRET="<shared-jwt-secret>"

# Environment
NODE_ENV="development"
```

> **Note**: Get the actual values for these variables from your team lead. All team members use the same credentials for development.

#### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string for Prisma | `postgresql://user:pass@localhost:5432/shopme` |
| `DIRECT_URL` | Direct database connection (required for migrations on Neon) | Same as DATABASE_URL for local PostgreSQL |
| `NEXTAUTH_SECRET` | Secret key for NextAuth JWT encryption | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` (dev) |
| `STRIPE_SECRET_KEY` | Stripe secret key (starts with `sk_`) | From Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | From Stripe webhook settings |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key (client-side) | Starts with `pk_` |
| `GMAIL_USER` | Gmail address for sending emails | `yourapp@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail app-specific password (not your regular password) | 16-character code |
| `JWT_VERIFICATION_SECRET` | Secret for email verification tokens | Any secure random string |
| `NODE_ENV` | Environment mode | `development` or `production` |

### 4. Database Setup

The Prisma Client is automatically generated during `npm install` via the postinstall script. Since the team shares the same Neon database, the tables and data already exist - no additional setup needed!

> **Note**: If you encounter any Prisma-related issues, you can manually regenerate the client with `npm run db:generate`

### 5. Shared File Storage

The team shares the same `public/uploads/` folder for images (products, stores, brands). Make sure this folder is synced or shared among team members to see uploaded images.

> **Important**: The `public/uploads/` folder is ignored by git (see `.gitignore`). Use a shared folder solution (Google Drive, Dropbox, etc.) or commit it to the repo if needed for your team workflow.

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🎯 Usage

### Development

```bash
npm run dev          # Start development server with Turbopack
```

### Production

```bash
npm run build        # Build for production
npm start            # Start production server
```

### Database Commands

```bash
npm run db:generate  # Regenerate Prisma Client (if needed)
```

> **Note**: Since the team shares the same database, avoid running `db:migrate`, `db:seed`, or `db:push` commands unless coordinating with the team to prevent conflicts.

### Default Admin Account

The shared database already has admin and test accounts set up:

- **Email**: `admin@shopme.com`
- **Password**: Contact your team lead for credentials

---

## 📁 Project Structure

```
shopme/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (accessible to all)
│   │   ├── account/              # User account page
│   │   ├── cart/                 # Shopping cart
│   │   ├── orders/               # Order history
│   │   ├── product/              # Product details
│   │   ├── shop/                 # Shop/Store pages
│   │   └── page.jsx              # Homepage
│   ├── admin/                    # Admin dashboard routes
│   │   ├── approve/              # Store approval
│   │   ├── brands/               # Brand management
│   │   ├── categories/           # Category management
│   │   ├── vouchers/              # Voucher management
│   │   ├── dashboard/            # Admin dashboard
│   │   ├── orders/               # All orders
│   │   ├── products/             # All products
│   │   ├── stores/               # Store management
│   │   └── users/                # User management
│   ├── store/                    # Store owner routes
│   │   ├── add-product/          # Add new product
│   │   ├── dashboard/            # Store dashboard
│   │   ├── edit-product/         # Edit product
│   │   ├── manage-product/       # Product list
│   │   ├── orders/               # Store orders
│   │   └── settings/             # Store settings
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin API endpoints
│   │   ├── store/                # Store API endpoints
│   │   ├── products/             # Product queries
│   │   ├── orders/               # Order management
│   │   ├── stripe/               # Stripe integration
│   │   └── ...                   # Other API routes
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── store/                    # Store-specific components
│   ├── homepage/                 # Homepage components
│   ├── ui/                       # Shadcn/ui components
│   └── ...                       # Shared components
│
├── lib/                          # Utility libraries
│   ├── features/                 # Redux features/slices
│   │   ├── cart/                 # Cart slice
│   │   ├── product/              # Product slice
│   │   └── ...
│   ├── prisma.js                 # Prisma client instance
│   ├── email.js                  # Email utilities
│   ├── verification.js           # Email verification logic
│   ├── inngest.js                # Inngest client
│   └── inngest-functions.js      # Background jobs
│
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration files
│   ├── seed.js                   # Seed data script
│   └── dummy-data.js             # Sample data
│
├── public/                       # Static files
│   └── uploads/                  # Uploaded images
│
├── docu/                         # Documentation
│   ├── ERD_Project.md            # Entity Relationship Diagram
│   ├── SYSTEM_FEATURES_SUMMARY.md
│   └── ...                       # Additional docs
│
├── middleware.js                 # Next.js middleware (auth)
├── next.config.mjs               # Next.js configuration
└── package.json                  # Dependencies and scripts
```

---

## 🔐 User Roles & Permissions

### CUSTOMER
- Browse and search products
- Manage shopping cart
- Place orders
- View order history
- Rate and review products
- Manage delivery addresses
- Update profile information

**Protected Routes**: `/account`, `/cart`, `/orders`

### STORE_OWNER
- All customer permissions
- Create and manage store
- Add/edit/delete products
- Manage inventory
- Process orders
- View store analytics
- Update store settings

**Protected Routes**: `/store/*`

### ADMIN
- Full system access
- Approve/reject stores
- Manage all users
- Manage categories and brands
- Create vouchers
- View system-wide analytics
- Moderate content

**Protected Routes**: `/admin/*`

### Route Protection

Route protection is implemented in `middleware.js` using NextAuth.js middleware:

- Public routes: `/`, `/login`, `/register`, `/products/*`, `/shop/*`
- Authentication required: `/account`, `/cart`, `/orders`
- Store owner only: `/store/*`
- Admin only: `/admin/*`

---

## 🎨 Key Features Details

### Multi-Vendor Architecture

ShopMe supports multiple independent stores on a single platform:

1. **Store Isolation**: Each store operates independently
2. **Order Splitting**: Cart items from different stores create separate orders
3. **Independent Management**: Store owners only see their own data
4. **Centralized Admin**: Admins oversee all stores from one dashboard

### Order Creation Flow

```
1. Customer selects products from cart
2. System validates stock availability
3. System checks store and product active status
4. Items grouped by store
5. Separate order created for each store
6. Inventory deducted atomically (database transaction)
7. Payment processed (COD or Stripe)
8. Order confirmation email sent (Inngest background job)
```

### Store Approval Process

```
1. User registers store → Status: PENDING
2. Admin reviews application
3. Admin approves → Status: APPROVED
4. User role automatically changed: CUSTOMER → STORE_OWNER
5. Store owner can now access store dashboard
6. Store owner can start listing products
```

### Cart Synchronization

- Cart stored in User model as JSON
- Real-time sync between client (Redux) and server
- Automatic cleanup on logout
- Cross-device cart persistence
- Stock validation before checkout

### Inventory Management

- Real-time stock tracking
- Atomic inventory deduction on order creation
- Prevents overselling with database constraints
- Low stock handling
- Out-of-stock product exclusion

### Payment Integration

**Stripe Integration**:
- Secure payment intent creation
- Client-side card element
- Webhook for payment confirmation
- Automatic order creation on successful payment
- Payment metadata tracking

**Cash on Delivery (COD)**:
- Order created immediately
- Payment status: unpaid
- Store marks as paid after delivery

---

## 🔌 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/[...nextauth]` | NextAuth.js authentication | No |
| POST | `/api/register` | User registration | No |
| POST | `/api/auth/send-verification` | Send verification email | No |
| POST | `/api/auth/verify-email` | Verify email with code | No |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user` | Get user profile | Yes |
| PUT | `/api/user` | Update user profile | Yes |
| PUT | `/api/user/cart` | Update cart | Yes |

### Store Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/store/register` | Register new store | Yes (Customer) |
| GET | `/api/store/[id]` | Get store details | No |
| PUT | `/api/store/[id]` | Update store | Yes (Owner/Admin) |
| GET | `/api/store/products` | Get store products | Yes (Owner) |
| POST | `/api/store/products` | Add product | Yes (Owner) |
| PUT | `/api/store/products/[id]` | Update product | Yes (Owner) |
| DELETE | `/api/store/products/[id]` | Delete product | Yes (Owner) |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/stores` | Get all stores | Yes (Admin) |
| PUT | `/api/admin/stores/[id]` | Approve/reject store | Yes (Admin) |
| GET | `/api/admin/users` | Get all users | Yes (Admin) |
| PUT | `/api/admin/users/[id]` | Update user status | Yes (Admin) |
| POST | `/api/admin/categories` | Create category | Yes (Admin) |
| POST | `/api/admin/brands` | Create brand | Yes (Admin) |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | No |
| GET | `/api/products/[id]` | Get product details | No |
| GET | `/api/products/search` | Search products | No |
| GET | `/api/products/category/[slug]` | Get by category | No |
| GET | `/api/products/brand/[slug]` | Get by brand | No |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders` | Get user orders | Yes |
| GET | `/api/orders/[id]` | Get order details | Yes |
| PUT | `/api/orders/[id]` | Update order status | Yes (Owner/Admin) |

### Stripe Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/stripe/create-payment-intent` | Create payment intent | Yes |
| POST | `/api/stripe/webhook` | Stripe webhook handler | No (Stripe) |

---

## 💾 Database Schema

### Core Models

**User**: Customer, store owner, or admin accounts
- Fields: id, name, email, password, role, cart, profile info
- Relations: Store (1:1), Orders, Addresses, Ratings

**Store**: Vendor stores on the platform
- Fields: id, name, username, description, logo, contact, status
- Relations: User (1:1), Products (1:N), Orders (1:N)

**Product**: Items for sale
- Fields: id, name, description, price, images, quantity, isActive
- Relations: Store, Category, Brand, OrderItems, Ratings

**Order**: Customer purchases
- Fields: id, total, status, payment info
- Relations: User, Store, Address, OrderItems (1:N)

**OrderItem**: Individual products in an order
- Fields: orderId, productId, quantity, price
- Composite primary key

**Category**: Product categories
- Fields: id, name, slug, isActive

**Brand**: Product brands
- Fields: id, name, slug, logo, description, isActive

**Voucher**: Discount codes/campaigns
- Fields: id, name, description, discount_type, discount_value, start_date, end_date, usage_limits

**Address**: Delivery addresses
- Fields: id, name, street, city, state, country, phone

**Rating**: Product reviews
- Fields: id, rating (1-5), review text, user, product, order

### Key Relationships

- User ↔ Store (1:1)
- Store → Products (1:N)
- Store → Orders (1:N)
- User → Orders (1:N as buyer)
- Product → OrderItems (1:N)
- Order → OrderItems (1:N)
- Product ↔ Category (N:1)
- Product ↔ Brand (N:1)

For detailed schema documentation, see `/docu/ERD_Project.md`

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start development server with Turbopack |
| Build | `npm run build` | Build for production (includes Prisma generate) |
| Start | `npm start` | Start production server |
| Lint | `npm run lint` | Run ESLint |
| Generate | `npm run db:generate` | Regenerate Prisma Client (if needed) |

> **Team Development Note**: Database commands like `db:migrate`, `db:seed`, and `db:push` should only be run by the team lead to avoid conflicts in the shared database.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 👥 Authors & Contributors

**Development Team**:
- Nguyen Thi Tuyet Hai - N21DCCN098
- Nguyen Viet Anh - N21DCCN009
- Nguyen Minh Chau - BCDK1

For support or questions, please open an issue in the GitHub repository.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Stripe](https://stripe.com/) - Payment processing
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vercel](https://vercel.com/) - Deployment platform
- [Neon](https://neon.tech/) - Serverless PostgreSQL

---

<div align="center">

**ShopMe** - Building the future of multi-vendor e-commerce

Made with ❤️ by the ShopMe Team

</div>

