"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserDashboard } from "../../../components/UserDashboard";

export default function UserDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
    } else if (role !== "user" && role !== "admin") {
      router.push("/login"); // Or access denied page
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <UserDashboard />;
}
