// src/pages/Login.tsx
import { useNavigate } from "react-router-dom";
import { Auth } from "../components/Auth";

export const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Auth onLogin={handleLogin} />
    </div>
  );
};
