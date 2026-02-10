import React, { useState } from "react";
import { toast } from "react-hot-toast"; // Alerts
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Toggle Login vs Signup
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isLogin ? "/login" : "/register";
    const payload = isLogin ? { email, password } : { username, email, password };

    try {
      const { data } = await axios.post(`https://critic.onrender.com/api/users${endpoint}`, payload);

      // Save the token to local storage (The Badge)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      toast.success(isLogin ? "Welcome back!" : "Account created!");
      navigate("/home"); // Redirect to Editor
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 text-green-500">{isLogin ? "Login to CRITIC" : "Join CRITIC"}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="mt-2 p-3 rounded bg-green-600 hover:bg-green-500 font-bold transition">
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span className="text-green-400 cursor-pointer ml-2 hover:underline" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create one" : "Login here"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
