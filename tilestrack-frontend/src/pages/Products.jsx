// src/pages/Products.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import Select from "react-select";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredProduct, setFilteredProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: "", category: "", size: "", price: "", stock_qty: "", min_stock: "" });
  const [newProduct, setNewProduct] = useState({ name: "", category: "", size: "", price: "", stock_qty: "", min_stock: "" });

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
      setLoading(false);
    } catch {
      setError("Failed to fetch products");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // react-select options
  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.name} (${p.category}) - Stock: ${p.stock_qty}`,
  }));

  // If a product is selected → show only that one
  const displayedProducts = filteredProduct
    ? products.filter(p => p.id === filteredProduct.value)
    : products;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch {
      alert("Error deleting product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setFormData(product);
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/products/${id}`, formData);
      setEditingProduct(null);
      fetchProducts();
    } catch {
      alert("Error updating product");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post("/products", {
        name: newProduct.name,
        category: newProduct.category,
        size: newProduct.size,
        price: Number(newProduct.price),
        stock_qty: Number(newProduct.stock_qty),
        min_stock: newProduct.min_stock ? Number(newProduct.min_stock) : undefined,
      });
      setNewProduct({ name: "", category: "", size: "", price: "", stock_qty: "", min_stock: "" });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || "Error adding product");
    }
  };

  // 🎨 Custom styles for react-select (clean dark theme)
  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#2a2a2a",
      borderColor: "#444",
      color: "#fff",
      minHeight: "42px",
    }),
    singleValue: (base) => ({ ...base, color: "#fff" }),
    input: (base) => ({ ...base, color: "#fff" }),
    menu: (base) => ({ ...base, backgroundColor: "#2a2a2a", border: "1px solid #444" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#333" : "#2a2a2a",
      color: "#fff",
    }),
  };

  return (
    <div className="page-container">
      <h2>Products Inventory</h2>

      {/* Add Product Panel */}
      <div className="dashboard-card">
        <h3>Add New Product</h3>
        <form onSubmit={handleAddProduct} className="grid-form">
          <div className="input-group">
            <label>Product Name</label>
            <input
              type="text"
              placeholder="e.g. Marble Tile"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Category</label>
            <input
              type="text"
              placeholder="e.g. Ceramic"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Size</label>
            <input
              type="text"
              placeholder="e.g. 60x60 cm"
              value={newProduct.size}
              onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Price</label>
            <input
              type="number"
              placeholder="0.00"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Stock Quantity</label>
            <input
              type="number"
              placeholder="0"
              value={newProduct.stock_qty}
              onChange={(e) => setNewProduct({ ...newProduct, stock_qty: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Min Stock (Optional)</label>
            <input
              type="number"
              placeholder="Auto"
              value={newProduct.min_stock}
              onChange={(e) => setNewProduct({ ...newProduct, min_stock: e.target.value })}
            />
          </div>
          
          <div className="form-actions">
            <button type="submit">Add Product</button>
          </div>
        </form>
      </div>

      {/* Search & Filter */}
      <div style={{ marginBottom: "1rem" }}>
        <Select
          value={filteredProduct}
          onChange={setFilteredProduct}
          options={productOptions}
          placeholder="Search or filter products..."
          isClearable
          styles={selectStyles}
        />
      </div>

      {displayedProducts.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="table-container">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Stock Qty</th>
                  <th>Min Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>
                      {editingProduct === p.id ? (
                        <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td>
                      {editingProduct === p.id ? (
                        <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                      ) : (
                        p.category
                      )}
                    </td>
                    <td>
                      {editingProduct === p.id ? (
                        <input value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
                      ) : (
                        p.size
                      )}
                    </td>
                    <td>
                      {editingProduct === p.id ? (
                        <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                      ) : (
                        p.price
                      )}
                    </td>
                    <td>
                      {editingProduct === p.id ? (
                        <input type="number" value={formData.stock_qty} onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })} />
                      ) : (
                        p.stock_qty
                      )}
                    </td>
                    <td>
                      {editingProduct === p.id ? (
                        <input type="number" value={formData.min_stock} onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })} />
                      ) : (
                        p.min_stock
                      )}
                    </td>
                    <td>
                      {editingProduct === p.id ? (
                        <div className="table-actions">
                          <button onClick={() => handleUpdate(p.id)}>Save</button>
                          <button className="secondary" onClick={() => setEditingProduct(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div className="table-actions">
                          <button className="secondary" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="danger" onClick={() => handleDelete(p.id)}>Delete</button>
                        </div>
                      )}
                    </td>
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

export default Products;
