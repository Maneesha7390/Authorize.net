import React, { useState, useEffect } from "react";
import { apiService, type PaymentProfile, type Plan } from "../services/api";

interface Subscription {
  _id: string;
  planId: string;
  planName: string;
  amount: number;
  intervalLength: number;
  intervalUnit: string;
  status: string;
  createdAt: string;
}

interface SubscriptionFormProps {
  onSuccess: () => void;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [cardType, setCardType] = useState("");

  useEffect(() => {
    loadPlans();
    loadCards();
    if (customerId) loadSubscriptions();
  }, [customerId]);

  const loadCards = async () => {
    try {
      const cards = await apiService.getCards();
      setPaymentProfiles(cards);
      if (cards.length > 0 && cards[0].customerId) {
        setCustomerId(cards[0].customerId);
      }
    } catch (error) {
      console.error("Failed to load cards");
    }
  };

  const loadPlans = async () => {
    try {
      const data = await apiService.getPlans();
      setPlans(data.filter((plan: Plan) => plan.isActive));
    } catch (error) {
      console.error("Failed to load plans");
    }
  };

  const loadSubscriptions = async () => {
    try {
      const data = await apiService.getSubscriptionStatus(customerId);
      setSubscriptions(data);
    } catch (error) {
      console.error("Failed to load subscriptions");
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.addPaymentProfile({
        cardNumber,
        expirationDate,
        cardCode,
        cardType,
      });
      loadCards();
      setToast({
        message: "Payment method added successfully!",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
      setCardNumber("");
      setExpirationDate("");
      setCardCode("");
      setCardType("");
      setShowPaymentForm(false);
    } catch (error) {
      setToast({ message: "Failed to add payment method", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || !selectedPlanId) {
      alert("Please select a payment profile and plan");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createSubscription({
        customerId,
        paymentProfileId: selectedProfileId,
        planId: selectedPlanId,
      });

      setToast({
        message: "Subscription created successfully!",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);

      const selectedPlanData = plans.find((p) => p._id === selectedPlanId);
      if (selectedPlanData) {
        setSubscriptions((prev) => [
          ...prev,
          {
            _id: response._id,
            planId: selectedPlanId,
            planName: selectedPlanData.name,
            amount: selectedPlanData.amount,
            intervalLength: selectedPlanData.intervalLength,
            intervalUnit: selectedPlanData.intervalUnit,
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      onSuccess();
      setShowForm(false);
    } catch (error) {
      console.error(error);
      alert("Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (newPlanId: string) => {
    const activeSubscription = subscriptions.find(
      (sub) => sub.status === "ACTIVE"
    );
    if (!activeSubscription) return;

    try {
      await apiService.upgradeSubscription(activeSubscription._id, newPlanId);
      loadSubscriptions();
      setToast({
        message: "Subscription upgraded successfully!",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      alert("Failed to upgrade subscription");
    }
  };

  const cancelSubscription = async (planId: string) => {
    const subscription = subscriptions.find((sub) => sub.planId === planId);
    if (!subscription) return;

    try {
      await apiService.cancelSubscription(subscription._id);
      setSubscriptions((prev) =>
        prev.filter((sub) => sub._id !== subscription._id)
      );
      setToast({
        message: "Subscription cancelled successfully!",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      alert("Failed to cancel subscription");
    }
  };

  const isSubscribed = (planId: string) => {
    return subscriptions.some(
      (sub) => sub.planId === planId && sub.status === "ACTIVE"
    );
  };

  const selectedPlan = plans.find((plan) => plan._id === selectedPlanId);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-fade-in ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Payment Methods Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-blue-600">💳</span> Payment Methods
          </h3>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 text-sm font-semibold shadow-md hover:shadow-lg transition"
          >
            + Add Card
          </button>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paymentProfiles.map((profile) => (
            <div
              key={profile._id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
            >
              <div className="font-semibold text-gray-800 text-lg">
                {profile.cardType}
              </div>
              <div className="text-gray-600 text-xl mt-1">
                •••• {profile.last4}
              </div>
              <div className="text-xs text-gray-400 mt-3">
                Expires: {profile.expirationDate}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-indigo-600">📋</span> Available Plans
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all relative bg-gradient-to-br from-white to-gray-50"
            >
              {isSubscribed(plan._id) && (
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                  ✓ Active
                </span>
              )}
              <h4 className="font-bold text-xl text-gray-800 mb-2">
                {plan.name}
              </h4>
              <p className="text-gray-600 text-sm mb-4 min-h-[40px]">
                {plan.description}
              </p>
              <p className="text-3xl font-bold text-indigo-600 mb-1">
                ${plan.amount}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                per {plan.intervalLength} {plan.intervalUnit}
              </p>

              {isSubscribed(plan._id) ? (
                <button
                  onClick={() => cancelSubscription(plan._id)}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 font-semibold shadow-md hover:shadow-lg transition"
                >
                  Cancel Plan
                </button>
              ) : subscriptions.some((sub) => sub.status === "ACTIVE") ? (
                <button
                  onClick={() => upgradeSubscription(plan._id)}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 font-semibold shadow-md hover:shadow-lg transition"
                >
                  choose plan
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedPlanId(plan._id);
                    setShowForm(true);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={paymentProfiles.length === 0}
                >
                  Subscribe Now
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Add Payment Method
              </h3>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiry
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Type
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                >
                  <option value="">Select Card Type</option>
                  <option value="Visa">Visa</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="American Express">American Express</option>
                  <option value="Discover">Discover</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Card"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showForm && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Subscribe to Plan
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl mb-6 border border-indigo-100">
              <h4 className="font-bold text-xl text-gray-800">
                {selectedPlan.name}
              </h4>
              <p className="text-gray-600 text-sm mt-2">
                {selectedPlan.description}
              </p>
              <p className="text-3xl font-bold text-indigo-600 mt-3">
                ${selectedPlan.amount}
              </p>
              <p className="text-sm text-gray-500">
                per {selectedPlan.intervalLength} {selectedPlan.intervalUnit}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Payment Method
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  required
                >
                  <option value="">Choose a card</option>
                  {paymentProfiles.map((profile) => (
                    <option key={profile._id} value={profile._id}>
                      {profile.cardType} •••• {profile.last4}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm Subscription"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
