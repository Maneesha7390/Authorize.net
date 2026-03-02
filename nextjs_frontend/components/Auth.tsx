"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "../services/api";

interface AuthProps {
  onLogin: () => void;
  isRegister?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ isRegister = false }) => {
  const router = useRouter();
  const [isLogin] = useState(!isRegister);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const response = await apiService.login({ email, password });
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("role", response.role);
        localStorage.setItem(
          "user",
          JSON.stringify({ email, role: response.role })
        );
        showToast("Login successful!", "success");
        setTimeout(() => {
          const userRole = response.role;
          if (userRole === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/user/dashboard");
          }
        }, 1000);
      } else {
        await apiService.register({ email, password, role });
        showToast(
          "Registration successful! Redirecting to login...",
          "success"
        );
        setEmail("");
        setPassword("");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    router.push(isLogin ? "/register" : "/login");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white font-semibold`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Sign in to your account" : "Sign up to get started"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={toggleMode}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};
