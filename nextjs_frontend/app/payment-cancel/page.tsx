"use client";

import { useRouter } from "next/navigation";

export default function PaymentCancel() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">✕</div>
        <h2 className="text-2xl font-bold mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">Your payment was not processed.</p>
        <button
          onClick={() => router.push("/user/dashboard")}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
