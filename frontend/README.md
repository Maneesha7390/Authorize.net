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


```bash
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

#  Data Flow

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

#  Security Design Principles

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

#  Required Environment Variables

AUTHORIZE_CLIENT_KEY
AUTHORIZE_API_LOGIN_ID

