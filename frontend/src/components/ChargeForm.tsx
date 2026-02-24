import React, { useState } from "react";
import { apiService } from "../services/api";
import { SuccessPage } from "./SuccessPage";

declare global {
  interface Window {
    Accept: any;
  }
}

export const ChargeForm: React.FC<any> = ({}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [amount, setAmount] = useState("");
  const [immediateCapture, setImmediateCapture] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionData, setTransactionData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const authData = {
      clientKey: import.meta.env.VITE_AUTHORIZE_CLIENT_KEY,
      apiLoginID: import.meta.env.VITE_AUTHORIZE_API_LOGIN_ID,
    };

    const cardData = {
      cardNumber: cardNumber,
      month: expirationDate.split("/")[0],
      year: expirationDate.split("/")[1],
      cardCode: cardCode,
    };

    const secureData = { authData, cardData };

    window.Accept.dispatchData(secureData, async (response: any) => {
      if (response.messages.resultCode === "Error") {
        setError(response.messages.message[0].text);
        setLoading(false);
        return;
      }

      try {
        const result = await apiService.chargeProfile({
          opaqueData: {
            dataDescriptor: response.opaqueData.dataDescriptor,
            dataValue: response.opaqueData.dataValue,
          },
          amount: parseFloat(amount),
          immediateCapture,
        });

        setTransactionData(result);
        setCardNumber("");
        setExpirationDate("");
        setCardCode("");
        setAmount("");
      } catch (err) {
        setError("Payment failed");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow"
      >
        <h3 className="text-lg font-semibold">Process Payment</h3>

        <input
          type="text"
          placeholder="Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="w-full p-2 border rounded"
          required
          maxLength={16}
        />

        <input
          type="text"
          placeholder="Expiration Date (MM/YY)"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="CVV"
          value={cardCode}
          onChange={(e) => setCardCode(e.target.value)}
          className="w-full p-2 border rounded"
          required
          maxLength={4}
        />

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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="immediateCapture"
            checked={immediateCapture}
            onChange={(e) => setImmediateCapture(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="immediateCapture" className="text-sm text-gray-700">
            Immediate Capture
          </label>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Processing..." : `Charge $${amount || "0.00"}`}
        </button>
      </form>

      {transactionData && (
        <SuccessPage
          transactionData={transactionData}
          onClose={() => setTransactionData(null)}
        />
      )}
    </>
  );
};
