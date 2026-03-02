# Authorize.net Integration Backend (Express.js)

This is a production-ready Express.js and TypeScript backend designed to handle secure payment processing and subscription management through Authorize.net.

The project follows a modular architecture to ensure clean code, easy maintenance, and clear separation of business logic from the payment gateway configuration.

---

## Core Features

- Standard Checkout: Process one-time charges with Credit Cards or Opaque Coupons.
- Subscription Management (ARB): Handle recurring billing, upgrade, pause, and cancellation flows.
- Customer Profiles (CIM): Securely store and manage customer payment profiles for future use.
- Hosted Payment Page: Generate secure tokens to redirect users to Authorize.net's checkout page.
- Webhooks: Real-time listening for payment and subscription events.
- Admin Module: Administrative tools to view user history, transactions, and system-wide stats.

---

## Technical Stack

- Backend: Node.js and Express.js
- Language: TypeScript
- Database: MongoDB with Mongoose
- Validation: Joi
- Security: JWT Authentication and Bcrypt for password encryption

---

## Installation and Setup

1. Clone the project and navigate into the directory.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Connect your MongoDB database by providing the URI in the configuration.
4. Run the project in development mode:
   ```bash
   npm run dev
   ```

---

## Authorize.net Sandbox Registration

To test payments without using real money, you will need a sandbox account.

Step 1: Register for a Sandbox Account
Go to the official Authorize.net developer site:
https://developer.authorize.net/hello_world/sandbox/
Fill out the form and submit it.

Step 2: Activate Your Account
Check your email for an activation link. Once clicked, you can log in.

Step 3: Access the Interface
Log in to the Sandbox Merchant Interface:
https://sandbox.authorize.net/

Step 4: Get API Login ID and Transaction Key
Inside the portal, go to Account -> Security Settings -> API Login ID and Transaction Key.
Copy your API Login ID and generate a new Transaction Key.

---

## Configuration

Create a .env file in the root of the project and add the following variables:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27015/authorize-net
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

AUTHORIZE_NET_LOGIN_ID=your_api_login_id
AUTHORIZE_NET_TRANSACTION_KEY=your_transaction_key
AUTHORIZE_NET_ENVIRONMENT=sandbox

WEBHOOK_SIGNATURE_KEY=your_webhook_key
```

---

## Project Structure

- src/modules/auth: User registration, login, and security logic.
- src/modules/customers: Managing saved cards and customer profiles.
- src/modules/payments: Processing direct and one-time chargers.
- src/modules/subscriptions: Lifecycle for recurring payments and plans.
- src/modules/webhooks: Handling automated notifications from Authorize.net.
- src/modules/admin: Managing users and auditing history.
- src/common: Shared services like the AuthorizeNetService.
