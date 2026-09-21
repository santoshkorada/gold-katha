# GoldKatha

GoldKatha is a modern, multi-tenant SaaS application designed specifically for pawn brokers and gold loan businesses. It completely digitizes the process of issuing gold loans, managing vaults, tracking chronological ledgers, and settling accounts.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-3ipphu8a)

---

## 🚀 Key Features

### 1. Multi-Tenant Architecture
GoldKatha supports multiple independent shops (Tenants). When a shop owner signs up, the system automatically provisions an isolated workspace for them. All data (loans, transactions, customers, gold rates) is strictly partitioned using PostgreSQL Row Level Security (RLS), ensuring absolute data privacy between different businesses.

### 2. Comprehensive Loan Management
- **Digital Loan Creation**: Capture customer details, mobile numbers, gross/net weight of gold, and purity (24K, 22K, Custom).
- **Photo Evidence**: Upload images of the pledged jewelry directly to the loan file.
- **LTV Calculation**: Automatically calculates the Loan-to-Value percentage to manage risk.
- **Vault Assignment**: Track exactly where the gold is physically stored by assigning Locker and Bag numbers.

### 3. Advanced Interest & Ledger Engine
- **Flexible Interest Types**: Support for both Daily and Monthly simple interest calculations.
- **Chronological Ledger**: A robust transaction engine that allows customers to make partial payments (interest-only or principal reduction) at any point in time. 
- **Minimum Interest Rules**: The engine gracefully handles standard pawn-shop rules (e.g., minimum 1-month interest) even during partial early settlements.

### 4. Dynamic Gold Pricing
Shop owners can configure and maintain their own localized gold rates for 24K and 22K gold, as well as a custom per-gram price, right from the dashboard.

### 5. Cross-Platform
Built natively with Expo, GoldKatha shares a single codebase that compiles beautifully to **iOS, Android, and the Web**.

### 6. Digital Receipts
Say goodbye to paper slips. Generate detailed, formatted text receipts and easily share them with customers via WhatsApp or SMS.

---

## 🏗️ Architecture & Tech Stack

### Frontend (Client App)
- **Framework**: [Expo](https://expo.dev/) & React Native.
- **Navigation**: Expo Router (File-based routing).
- **Styling**: Custom theme tokens with `StyleSheet` for high performance.
- **Icons**: `lucide-react-native`.

### Backend & Database (BaaS)
- **Provider**: [Supabase](https://supabase.com/).
- **Database**: PostgreSQL.
- **Authentication**: Supabase Auth (OTP/Password) tied to PostgreSQL triggers that automatically bootstrap user profiles and tenant workspaces.
- **Storage**: Supabase Storage for storing jewelry images.
- **Security**: Strict Row Level Security (RLS) policies force tenant isolation. A user can only read/write data that belongs to `get_current_user_tenant_id()`.

---

## 🗄️ Database Schema Summary

1. **`tenants`**: The core business workspaces (Shops). Stores shop name and location.
2. **`profiles`**: Public user details linked 1-to-1 with Supabase `auth.users`.
3. **`tenant_users`**: Maps users to tenants with specific roles (e.g., owner, manager, clerk).
4. **`gold_rates`**: Tenant-specific gold rates (24K, 22K, custom).
5. **`loans`**: Core loan contracts containing principal, interest rates, customer details, and gold weight.
6. **`transactions`**: The ledger table tracking partial `interest_payment` and `principal_payment` events.

---

## 💻 Running the Project Locally

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase Project

### 2. Environment Setup
Create a `.env` file in the root directory and add your Supabase keys:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Initialization
Copy the SQL commands from `supabase/schema.sql` and run them in your Supabase SQL Editor to set up the tables, triggers, and RLS policies.

### 4. Start the Application
```bash
# Install dependencies
npm install

# Start the Expo development server
npm run dev
```

Press `w` to open the app in a web browser, or scan the QR code with the Expo Go app to view it on your physical mobile device.
