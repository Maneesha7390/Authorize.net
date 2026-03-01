"use client";

import React, { useState } from "react";
import { apiService } from "../services/api";

export const ChargeForm: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState(
    "authCaptureTransaction"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { token } = await apiService.createHostedPayment({
        amount: parseFloat(amount),
        immediateCapture: transactionType === "authCaptureTransaction",
        returnUrl:
          process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL ||
          `${window.location.origin}/payment-success`,
        cancelUrl:
          process.env.NEXT_PUBLIC_PAYMENT_CANCEL_URL ||
          `${window.location.origin}/payment-cancel`,
      });

      const form = document.createElement("form");
      form.method = "POST";
      form.action =
        process.env.NEXT_PUBLIC_AUTHORIZE_PAYMENT_URL ||
        "https://test.authorize.net/payment/payment";
      form.innerHTML = `<input type="hidden" name="token" value="${token}" />`;
      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create payment");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow"
    >
      <h3 className="text-lg font-semibold">Secure Payment</h3>
      <p className="text-sm text-gray-600">
        You'll be redirected to Authorize.net's secure payment page
      </p>

      <input
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Type
        </label>
        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="authCaptureTransaction">
            Charge (Immediate Capture)
          </option>
          <option value="authOnlyTransaction">
            Authorize Only (Capture Later)
          </option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {transactionType === "authCaptureTransaction"
            ? "Payment will be charged immediately"
            : "Payment will be authorized but not charged until captured"}
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay $${amount || "0.00"} Securely`}
      </button>
    </form>
  );
};
