"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiService, type UserData } from "../services/api";
import { PlanManager } from "./PlanManager";

export const AdminDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<"customers" | "plans">(
    "customers"
  );
  const [popupTab, setPopupTab] = useState<"transactions" | "subscriptions">(
    "transactions"
  );
  const [actionPopup, setActionPopup] = useState<{
    action: "capture" | "void" | "refund";
    transaction: any;
  } | null>(null);
  const [refundData, setRefundData] = useState({
    amount: "",
    last4: "",
    expirationDate: "",
    cardType: "",
    reason: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await apiService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const handleActionClick = (
    action: "capture" | "void" | "refund",
    transaction: any
  ) => {
    setActionPopup({ action, transaction });
    if (action === "refund") {
      setRefundData({
        amount: transaction.amount.toString(),
        last4: "",
        expirationDate: "",
        cardType: "",
        reason: "",
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!actionPopup) return;

    try {
      const { action, transaction } = actionPopup;

      if (action === "capture") {
        await apiService.captureTransaction(transaction._id);
        alert("Transaction captured successfully");
      } else if (action === "void") {
        await apiService.voidTransaction(transaction._id);
        alert("Transaction voided successfully");
      } else if (action === "refund") {
        await apiService.refundTransaction({
          transactionId: transaction._id,
          amount: parseFloat(refundData.amount),
          last4: refundData.last4,
          expirationDate: refundData.expirationDate,
          cardType: refundData.cardType,
          reason: refundData.reason,
        });
        alert("Transaction refunded successfully");
      }

      loadUsers();
      setActionPopup(null);
    } catch (error) {
      alert(`Failed to ${actionPopup.action} transaction`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex border-b border-gray-200">
            {(["customers", "plans"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "customers" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Customers
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Customer ID
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Transactions
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userData) => (
                        <tr
                          key={userData.user._id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {userData?.customer?.firstName}{" "}
                            {userData?.customer?.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {userData?.customer?.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {userData?.customer?.authorizeNetCustomerId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {userData?.transactionCount}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedUser(userData);
                                setPopupTab("transactions");
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === "plans" && <PlanManager />}
          </div>
        </div>
      </main>

      {/* User Details Popup */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedUser.customer.firstName}{" "}
                {selectedUser.customer.lastName}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-800">
                    {selectedUser.customer.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Customer ID:</span>
                  <span className="ml-2 text-gray-800">
                    {selectedUser.customer.authorizeNetCustomerId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setPopupTab("transactions")}
                className={`px-6 py-3 text-sm font-medium ${
                  popupTab === "transactions"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Transactions ({selectedUser.transactions.length})
              </button>
              <button
                onClick={() => setPopupTab("subscriptions")}
                className={`px-6 py-3 text-sm font-medium ${
                  popupTab === "subscriptions"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Subscriptions ({selectedUser.subscriptions.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {popupTab === "transactions" && (
                <div className="space-y-3">
                  {selectedUser.transactions.length > 0 ? (
                    selectedUser.transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-800 text-lg">
                              ${transaction.amount} {transaction.currency}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {transaction.authorizeNetTransactionId}
                            </div>
                            <div className="text-xs text-gray-500">
                              Type: {transaction.type}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleString()}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded font-medium ${
                              transaction.status === "SUCCESS"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {transaction.status === "SUCCESS" &&
                            transaction.type === "CHARGE" && (
                              <button
                                onClick={() =>
                                  handleActionClick("void", transaction)
                                }
                                className="text-xs bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
                              >
                                Void
                              </button>
                            )}
                          {transaction.status === "SUCCESS" &&
                            transaction.type === "AUTHORIZE" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleActionClick("capture", transaction)
                                  }
                                  className="text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                                >
                                  Capture
                                </button>
                                <button
                                  onClick={() =>
                                    handleActionClick("void", transaction)
                                  }
                                  className="text-xs bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
                                >
                                  Void
                                </button>
                              </>
                            )}
                          {transaction.status === "SETTLED" &&
                            (transaction.type === "CHARGE" ||
                              transaction.type === "CAPTURE") && (
                              <button
                                onClick={() =>
                                  handleActionClick("refund", transaction)
                                }
                                className="text-xs bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                              >
                                Refund
                              </button>
                            )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No transactions found
                    </p>
                  )}
                </div>
              )}

              {popupTab === "subscriptions" && (
                <div className="space-y-3">
                  {selectedUser.subscriptions.length > 0 ? (
                    selectedUser.subscriptions.map((sub: any) => (
                      <div
                        key={sub._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-800 text-lg">
                              {sub.planName || "Subscription"}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              ${sub.amount || "N/A"} /{" "}
                              {sub.intervalUnit || "month"}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Subscription ID:{" "}
                              {sub.authorizeNetSubscriptionId || sub._id}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Created:{" "}
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded font-medium ${
                              sub.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No subscriptions found
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Popup */}
      {actionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-800">
                Confirm{" "}
                {actionPopup.action.charAt(0).toUpperCase() +
                  actionPopup.action.slice(1)}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Transaction: ${actionPopup.transaction.amount} (
                {actionPopup.transaction.authorizeNetTransactionId})
              </p>

              {actionPopup.action === "refund" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={refundData.amount}
                      onChange={(e) =>
                        setRefundData({ ...refundData, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last 4 Digits
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={refundData.last4}
                      onChange={(e) =>
                        setRefundData({ ...refundData, last4: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={refundData.expirationDate}
                      onChange={(e) =>
                        setRefundData({
                          ...refundData,
                          expirationDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Type
                    </label>
                    <select
                      value={refundData.cardType}
                      onChange={(e) =>
                        setRefundData({
                          ...refundData,
                          cardType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="">Select Card Type</option>
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                      <option value="American Express">American Express</option>
                      <option value="Discover">Discover</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={refundData.reason}
                      onChange={(e) =>
                        setRefundData({
                          ...refundData,
                          reason: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={2}
                      placeholder="Customer request"
                    />
                  </div>
                </div>
              )}

              {actionPopup.action === "capture" && (
                <p className="text-sm text-gray-600">
                  Are you sure you want to capture this authorized transaction?
                </p>
              )}

              {actionPopup.action === "void" && (
                <p className="text-sm text-gray-600">
                  Are you sure you want to void this transaction?
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setActionPopup(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    actionPopup.action === "refund"
                      ? "bg-red-500 hover:bg-red-600"
                      : actionPopup.action === "void"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
