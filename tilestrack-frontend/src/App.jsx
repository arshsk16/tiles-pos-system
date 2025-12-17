import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import Navbar from "./components/Navbar";
import Sales from "./pages/Sales";
import LowStock from "./pages/LowStock";

function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      {token && <Navbar />}

      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/products" element={token ? <Products /> : <Navigate to="/auth" />} />
        <Route path="/sales" element={token ? <Sales /> : <Navigate to="/auth" />} />
        <Route path="/low-stock" element={token ? <LowStock /> : <Navigate to="/auth" />} />
        <Route path="*" element={<Navigate to={token ? "/products" : "/auth"} />} />
      </Routes>
    </Router>
  );
}

export default App;
