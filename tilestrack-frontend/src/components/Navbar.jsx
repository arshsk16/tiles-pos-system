// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (username) {
      api.get("/products/low-stock/count")
        .then(res => setLowStockCount(res.data.count))
        .catch(() => setLowStockCount(0));
    }
  }, [username, location.pathname]); // Refresh on route change

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/auth");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => navigate("/products")}>
          AP Tiles
        </div>
        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {username && <span className="navbar-username">{username}</span>}
          <button onClick={() => navigate("/products")}>Products</button>
          <button onClick={() => navigate("/sales")}>Sales</button>
          <button onClick={() => navigate("/low-stock")}>
            Low Stock {lowStockCount > 0 && <span className="badge">{lowStockCount}</span>}
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
        <div className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>
      </div>
    </nav>
  );
}
