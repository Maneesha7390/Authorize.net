"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChargeForm } from "./ChargeForm";
import { SubscriptionForm } from "./SubscriptionForm";

export const UserDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"charge" | "subscription">(
    "charge"
  );

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
          <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
          <div className="flex items-center gap-4">
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
            {(["charge", "subscription"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab === "charge" ? "Payments" : "Subscriptions"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "charge" && (
              <ChargeForm onSuccess={() => alert("Charged successfully")} />
            )}
            {activeTab === "subscription" && (
              <SubscriptionForm
                onSuccess={() => alert("Subscription created")}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
