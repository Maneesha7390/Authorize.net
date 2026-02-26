import { useNavigate } from "react-router-dom";
import { Auth } from "../components/Auth";

export const Register = () => {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Auth onLogin={handleRegister} isRegister />
    </div>
  );
};
