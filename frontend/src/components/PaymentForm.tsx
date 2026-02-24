import React, { useState } from "react";
import { apiService, type CreatePaymentProfileData } from "../services/api";


interface PaymentFormProps {
  onSuccess: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreatePaymentProfileData>({
    cardNumber: "",
    expirationDate: "",
    cardCode: "",
    cardType: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiService.addPaymentProfile( formData);
      onSuccess();
    } catch (err) {
      setError("Failed to add payment method");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow"
    >
      <h3 className="text-lg font-semibold">Add Payment Method</h3>

      <input
        type="text"
        placeholder="Card Number"
        value={formData.cardNumber}
        onChange={(e) =>
          setFormData({ ...formData, cardNumber: e.target.value })
        }
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="text"
        placeholder="MM/YY"
        value={formData.expirationDate}
        onChange={(e) =>
          setFormData({ ...formData, expirationDate: e.target.value })
        }
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="text"
        placeholder="CVV"
        value={formData.cardCode}
        onChange={(e) => setFormData({ ...formData, cardCode: e.target.value })}
        className="w-full p-2 border rounded"
        maxLength={4}
        required
      />

      <select
        value={formData.cardType}
        onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">Select Card Type</option>
        <option value="Visa">Visa</option>
        <option value="MasterCard">MasterCard</option>
        <option value="American Express">American Express</option>
        <option value="Discover">Discover</option>
      </select>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Payment Method"}
      </button>
    </form>
  );
};
