"use client";

import React, { useState, useEffect } from "react";
import { apiService, type Plan } from "../services/api";
import { Toast } from "./Toast";

export const PlanManager = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    isActive: true,
    intervalLength: "1",
    intervalUnit: "months",
    totalOccurrences: "9999",
    trialAmount: "0",
    trialOccurrences: "0",
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await apiService.getPlans();
      setPlans(data);
    } catch (error) {
      console.error("Failed to load plans");
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      amount: plan.amount.toString(),
      isActive: plan.isActive,
      intervalLength: plan.intervalLength.toString(),
      intervalUnit: plan.intervalUnit,
      totalOccurrences: plan.totalOccurrences.toString(),
      trialAmount: plan.trialAmount.toString(),
      trialOccurrences: plan.trialOccurrences.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await apiService.deletePlan(planId);
      setToast({ message: "Plan deleted successfully", type: "success" });
      loadPlans();
    } catch (error) {
      setToast({ message: "Failed to delete plan", type: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await apiService.updatePlan(editingPlan._id, {
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          isActive: formData.isActive,
        });
        setToast({ message: "Plan updated successfully", type: "success" });
      } else {
        await apiService.createPlan({
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          intervalLength: parseInt(formData.intervalLength),
          intervalUnit: formData.intervalUnit,
          totalOccurrences: parseInt(formData.totalOccurrences),
          trialAmount: parseFloat(formData.trialAmount),
          trialOccurrences: parseInt(formData.trialOccurrences),
        });
        setToast({ message: "Plan created successfully", type: "success" });
      }

      loadPlans();
      handleCloseForm();
    } catch (error) {
      setToast({
        message: `Failed to ${editingPlan ? "update" : "create"} plan`,
        type: "error",
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      amount: "",
      isActive: true,
      intervalLength: "1",
      intervalUnit: "months",
      totalOccurrences: "9999",
      trialAmount: "0",
      trialOccurrences: "0",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Subscription Plans</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create New Plan
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="border rounded-lg p-4 hover:shadow-md transition"
          >
            <h4 className="font-semibold text-lg">{plan.name}</h4>
            <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              ${plan.amount}
            </p>
            <p className="text-sm text-gray-500">
              every {plan.intervalLength} {plan.intervalUnit}
            </p>
            <span
              className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                plan.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {plan.isActive ? "Active" : "Inactive"}
            </span>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan._id)}
                className="flex-1 text-xs bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Popup */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingPlan ? "Edit Plan" : "Create New Plan"}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plan Name
                  </label>
                  <input
                    placeholder="e.g., Premium Plan"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount ($)
                  </label>
                  <input
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Plan description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>

              {editingPlan && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700"
                  >
                    Active Plan
                  </label>
                </div>
              )}

              {!editingPlan && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Interval Length
                      </label>
                      <input
                        placeholder="1"
                        type="number"
                        value={formData.intervalLength}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            intervalLength: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Interval Unit
                      </label>
                      <select
                        value={formData.intervalUnit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            intervalUnit: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Total Occurrences
                      </label>
                      <input
                        type="number"
                        value={formData.totalOccurrences}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalOccurrences: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Trial Occurrences
                      </label>
                      <input
                        type="number"
                        value={formData.trialOccurrences}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            trialOccurrences: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trial Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.trialAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          trialAmount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                {editingPlan ? "Update Plan" : "Create Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
