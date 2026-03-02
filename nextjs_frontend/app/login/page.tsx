"use client";

import { Auth } from "../../components/Auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Auth onLogin={handleLogin} />
    </div>
  );
}
