// src/pages/LowStock.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStock = useCallback(async () => {
    try {
      const res = await api.get(`/products/low-stock`);
      setProducts(res.data);
      setLoading(false);
    } catch {
      setProducts([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  return (
    <div className="page-container">
      <h2>Low Stock Alerts</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : products.length === 0 ? (
        <p>All products are above minimum stock levels 🎉</p>
      ) : (
        <div className="table-container">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock Qty</th>
                  <th>Min Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td style={{ color: "#ef4444", fontWeight: "bold" }}>{p.stock_qty}</td>
                    <td>{p.min_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default LowStock;
