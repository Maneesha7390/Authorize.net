"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "../../../components/AdminDashboard";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
    } else if (role !== "admin") {
      router.push("/user/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <AdminDashboard />;
}
