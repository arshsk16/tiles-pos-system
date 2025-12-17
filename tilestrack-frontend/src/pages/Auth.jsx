import { useState } from "react";
import api from "../services/api";

function Auth() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        const res = await api.post("/login", { username, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", username);
        window.location.href = "/products";
      } else if (mode === "register") {
        await api.post("/register", { username, password });
        alert("Registered successfully. Please login.");
        setMode("login");
      } else if (mode === "reset") {
        const res = await api.post("/change-password", {
          old_password: oldPassword,
          new_password: newPassword,
        });
        alert(res.data.message);
        setMode("login");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h2>
          {mode === "login"
            ? "Login"
            : mode === "register"
            ? "Register"
            : "Reset Password"}
        </h2>
        <form onSubmit={handleSubmit}>
          {mode !== "reset" && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}

          {mode === "reset" && (
            <>
              <input
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </>
          )}

          <button type="submit">
            {mode === "login"
              ? "Login"
              : mode === "register"
              ? "Register"
              : "Change Password"}
          </button>

        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="auth-links">
          {mode === "login" && (
            <>
              <p>
                New user? <button onClick={() => setMode("register")}>Register</button>
              </p>
              <p>
                Forgot password? <button onClick={() => setMode("reset")}>Reset</button>
              </p>
            </>
          )}
          {(mode === "register" || mode === "reset") && (
            <p>
              Already have an account? <button onClick={() => setMode("login")}>Login</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
