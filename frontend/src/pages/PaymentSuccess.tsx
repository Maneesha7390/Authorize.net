import React from "react";
import { useNavigate } from "react-router-dom";

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your transaction has been processed.
        </p>
        <button
          onClick={() => navigate("/user/dashboard")}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
