# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Installation

1. Clone the repository
2. Install dependencies:

````bash
npm install

## Compile and run the project

```bash
# development
$ npm run dev

# production mode
$ npm run dev:prod

# Build for production
$ npm run build

# Preview production build locally
$ npm run preview

````

# Authorize.Net Payment Gateway Frontend

A React TypeScript application for managing payments, subscriptions, and customer profiles using Authorize.Net payment gateway.

## Features

- **Customer Management**: Create and manage customer profiles
- **Payment Processing**: Charge payments with capture/void/refund functionality
- **Payment Profiles**: Add and manage customer payment methods
- **Subscription Management**: Create, upgrade, and cancel recurring subscriptions
- **Plan Management**: Display available subscription plans
- **Transaction Actions**: Capture, refund, and void transactions
- **Toast Notifications**: Success and error feedback

## Tech Stack

- **React 19.2.0** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **ESLint** - Code linting

## Getting Started

Enterprise Payment Architecture – Authorize.Net Integration

This application integrates payment processing using Authorize.Net with a secure client-side tokenization approach (Accept.js).

The system is architected to ensure that sensitive cardholder data (PAN, CVV, expiration date) never reaches the backend infrastructure.

---

# 🏗 High-Level Architecture

Payment processing follows a tokenized flow:

1. Card details are collected in the browser.
2. Accept.js sends card data directly to Authorize.Net over HTTPS.
3. Authorize.Net returns a secure one-time `opaqueData` token.
4. The frontend sends only the token to the backend.
5. The backend creates a transaction using Authorize.Net's Transaction API.
6. Authorize.Net processes the payment and returns a response.

---

# Data Flow

User Browser  
 ↓ (Card Details – HTTPS)  
Authorize.Net (Tokenization Server)  
 ↓ (Opaque Token)  
Backend (NestJS API)  
 ↓  
Authorize.Net Transaction API  
 ↓  
Payment Response

---

# Security Design Principles

## 1. No Card Data Storage

- The backend never receives raw card numbers.
- The database does not store PAN, CVV, or expiry data.
- Logs are sanitized to prevent sensitive data exposure.

## 2. Token-Based Transactions

- Transactions are created using `opaqueData`.
- Tokens are short-lived and cannot be reused for arbitrary transactions.
- The backend only processes tokenized payment data.

## 3. Encrypted Communication

- All communication occurs over HTTPS (TLS 1.2+).
- Accept.js communicates directly with Authorize.Net servers.
- API calls from backend to Authorize.Net are encrypted.

## 4. Environment Isolation

- Sandbox and Production environments are separated.
- API credentials are stored in environment variables.
- No secrets are committed to source control.

---

# Required Environment Variables
VITE_AUTHORIZE_CLIENT_KEY=your_client_key_here
VITE_AUTHORIZE_API_LOGIN_ID=your_api_login_id_here
VITE_PAYMENT_SUCCESS_URL=https://your-ngrok-url.ngrok-free.app/payment-success
VITE_PAYMENT_CANCEL_URL=https://your-ngrok-url.ngrok-free.app/payment-cancel
VITE_AUTHORIZE_PAYMENT_URL=https://test.authorize.net/payment/payment


# ngrok Setup (Required for Accept Hosted)
Accept Hosted requires public HTTPS URLs for payment redirects. Follow these steps:

# Step 1: Download ngrok
Visit: https://ngrok.com/download

Download for your OS (Windows/Mac/Linux)

Extract ngrok.exe to a folder

# Step 2: Authenticate ngrok (One-time)
Sign up at: https://dashboard.ngrok.com/signup

Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

Run:

ngrok config add-authtoken YOUR_AUTH_TOKEN

Copy

Insert at cursor
bash
# Step 3: Start Frontend
npm run dev

Copy

Insert at cursor
bash
Frontend runs on: http://localhost:5173

# Step 4: Start ngrok Tunnel
Open a new terminal and run:

ngrok http 5173

Copy

Insert at cursor
bash
You'll see output like:

ngrok

Session Status                online
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:5173

Copy

Insert at cursor
Copy the HTTPS URL: https://abc123xyz.ngrok-free.app

# Step 5: Update .env File
Replace with your ngrok URL:

VITE_AUTHORIZE_CLIENT_KEY=9Qd7sDb7H4W9Wj4q8gRQ5QMKnN3LcE49XKk3zS58QF7CbGhFsqc8RnqZ3GhsmrT7
VITE_AUTHORIZE_API_LOGIN_ID=3M3gWn8G
VITE_PAYMENT_SUCCESS_URL=https://abc123xyz.ngrok-free.app/payment-success
VITE_PAYMENT_CANCEL_URL=https://abc123xyz.ngrok-free.app/payment-cancel
VITE_AUTHORIZE_PAYMENT_URL=https://test.authorize.net/payment/payment

Copy

Insert at cursor
env
# Step 6: Update vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["abc123xyz.ngrok-free.app"], // Replace with your ngrok subdomain
  },
});

Copy

Insert at cursor
typescript
Step 7: Restart Dev Server
# Stop current server (Ctrl+C)
npm run dev

Copy

Insert at cursor
bash
# Step 8: Access via ngrok URL
Open browser: https://abc123xyz.ngrok-free.app

⚠️ Important Notes:

Keep both terminals running (dev server + ngrok)

Free ngrok URL changes on restart

Update .env and vite.config.ts with new URL each time

Restart dev server after config changes

# 🔄 Accept Hosted Payment Flow
User clicks "Pay $50"
    ↓
Frontend → Backend: POST /payments/hosted-payment { amount: 50 }
    ↓
Backend → Authorize.Net: Generate hosted payment token
    ↓
Backend ← Authorize.Net: { token: "abc123xyz" }
    ↓
Frontend ← Backend: { token: "abc123xyz" }
    ↓
Frontend redirects to: https://test.authorize.net/payment/payment
    ↓
User enters card details on Authorize.Net's secure hosted page
    ↓
Authorize.Net processes payment
    ↓
Authorize.Net redirects to: https://abc123xyz.ngrok-free.app/payment-success

Copy

Insert at cursor
# 🏗 Architecture - Accept Hosted
This application uses Accept Hosted for maximum PCI compliance:

Why Accept Hosted?
No Card Data on Your Server - Card details entered only on Authorize.Net

PCI DSS SAQ A Compliance - Simplest compliance level

No SSL Required for Dev - ngrok provides HTTPS tunnel

Authorize.Net Handles Security - All card data processing on their servers

Data Flow
User Browser
    ↓ (Amount only)
Your Frontend (React)
    ↓ (Amount + redirect URLs)
Your Backend (NestJS)
    ↓ (Generate token request)
Authorize.Net API
    ↓ (Payment token)
Your Backend
    ↓ (Token)
Your Frontend
    ↓ (Redirect with token)
Authorize.Net Hosted Payment Page
    ↓ (User enters card)
Authorize.Net Payment Processing
    ↓ (Redirect to success/cancel URL)
Your Frontend (Success/Cancel Page)

Copy

Insert at cursor
🏃 Running the Application
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview


🔒 Security & PCI Compliance
Security Features
No Card Data Storage

Card details never touch your frontend or backend

All card data entered on Authorize.Net's secure page

Token-Based Flow

Backend generates one-time payment token

Token used only for redirect to Authorize.Net

No sensitive data in tokens

HTTPS Enforced

All payment pages use SSL/TLS

ngrok provides HTTPS tunnel for development

PCI DSS SAQ A Compliance

Simplest PCI compliance level

No card data on your infrastructure

Authorize.Net handles all card processing

Environment Isolation
Sandbox and Production environments separated

API credentials in environment variables

No secrets in source control

🐛 Troubleshooting
ngrok URL Changed
When ngrok restarts, the URL changes:

Check ngrok terminal for new URL

Update .env:

VITE_PAYMENT_SUCCESS_URL=https://NEW-URL.ngrok-free.app/payment-success
VITE_PAYMENT_CANCEL_URL=https://NEW-URL.ngrok-free.app/payment-cancel

Copy

Insert at cursor
env
Update vite.config.ts:

allowedHosts: ["NEW-URL.ngrok-free.app"]

Copy

Insert at cursor
typescript
Restart dev server: npm run dev

Payment Redirect Fails
✓ Ensure ngrok is running

✓ Check .env URLs match ngrok URL exactly

✓ Verify backend .env has same URLs

✓ Restart dev server after config changes

CORS Errors
Check backend CORS settings allow your ngrok URL

Restart backend after adding new URL

"Invalid host header" Error
Add ngrok domain to vite.config.ts allowedHosts

Restart dev server

🚀 Production Deployment
For production, replace ngrok URLs with your actual domain:

VITE_PAYMENT_SUCCESS_URL=https://yourdomain.com/payment-success
VITE_PAYMENT_CANCEL_URL=https://yourdomain.com/payment-cancel
VITE_AUTHORIZE_PAYMENT_URL=https://accept.authorize.n