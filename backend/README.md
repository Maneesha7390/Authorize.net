Authorize.net Integration Backend

A backend application built with NestJS to integrate with Authorize.net for secure payment processing and subscription management.

This project supports:

One-time payments

Subscription management

Secure API credential handling using environment variables

Tech Stack

NestJS

Authorize.net API

TypeScript

Installation

Clone the repository and install dependencies:

To test payments safely, create a sandbox account with Authorize.net.

Step 1: Register for a Sandbox Account

Visit:
https://developer.authorize.net/hello_world/sandbox/

Fill out the required details and submit the form.

Step 2: Activate Your Account

Check your email and click the activation link.

Step 3: Log in to Sandbox Merchant Interface

Visit:
https://sandbox.authorize.net/

Step 4: Get API Credentials

After logging in, navigate to:

Account → Security Settings → General Security Settings → API Login ID and Transaction Key

Copy:

API Login ID

Transaction Key (Generate if needed)

Configure Environment Variables

Open your .env file inside the backend directory and add:

AUTHORIZE_NET_API_LOGIN_ID=your_api_login_id
AUTHORIZE_NET_TRANSACTION_KEY=your_transaction_key
AUTHORIZE_NET_ENVIRONMENT=sandbox

sandbox registration is done.

