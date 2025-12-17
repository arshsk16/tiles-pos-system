// src/components/AddProductForm.jsx
import { useState } from "react";
import api from "../services/api";

export default function AddProductForm({ onAdded }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tiles");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post("/products", {
        name,
        category,
        size,
        price: parseFloat(price),
        stock_qty: parseInt(stock || "0", 10),
      });
      // clear form
      setName(""); setSize(""); setPrice(""); setStock("");
      onAdded && onAdded();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input required placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <input placeholder="Size" value={size} onChange={e => setSize(e.target.value)} />
        <input required placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <input placeholder="Stock" type="number" value={stock} onChange={e => setStock(e.target.value)} />
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Add"}</button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}
