// src/pages/Sales.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import Select from "react-select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Sales() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [stockQty, setStockQty] = useState(1);

  // Report Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterProduct, setFilterProduct] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [showReports, setShowReports] = useState(false);

  // Fetch products
  useEffect(() => {
    api.get("/products")
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]));
  }, []);

  // Fetch Sales Report
  const fetchReport = useCallback(async () => {
    try {
      const params = {};
      if (startDate) params.from = startDate;
      if (endDate) params.to = endDate;
      if (filterProduct) params.product_id = filterProduct.value;

      const [prodRes, dateRes] = await Promise.all([
        api.get("/sales/report", { params }),
        api.get("/sales/report", { params: { ...params, group_by: 'date' } })
      ]);

      setReportData(prodRes.data);
      setChartData(dateRes.data);
    } catch (err) {
      console.error("Error fetching report", err);
      setReportData([]);
      setChartData([]);
    }
  }, [startDate, endDate, filterProduct]);

  // Download CSV
  const downloadCSV = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("from", startDate);
    if (endDate) params.append("to", endDate);
    if (filterProduct) params.append("product_id", filterProduct.value);
    params.append("export", "csv");
    
    // Trigger download
    const url = `${api.defaults.baseURL}/sales/report?${params.toString()}`;
    window.open(url, '_blank');
  };

  // Initial load (defaults to current month)
  useEffect(() => {
    fetchReport();
  }, []); // Run once on mount

  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const res = await api.post("/sales", {
        product_id: selectedProduct.value,
        quantity: Number(quantity),
      });
      setMessage(res.data.message);
      setQuantity(1);
      setSelectedProduct(null);
      fetchReport(); // Refresh report
    } catch (err) {
      setMessage(err.response?.data?.error || "Error recording sale");
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const res = await api.put(`/products/${selectedProduct.value}`, {
        stock_qty: selectedProduct.stock_qty + Number(stockQty),
      });
      setMessage(res.data.message);
      setStockQty(1);
      fetchReport(); // Refresh report (though stock doesn't affect sales report directly, good to keep UI consistent)
    } catch (err) {
      setMessage(err.response?.data?.error || "Error updating stock");
    }
  };

  // react-select options
  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.name} (Stock: ${p.stock_qty})`,
    stock_qty: p.stock_qty,
  }));

  // Report options (cleaner label for filter)
  const filterOptions = products.map(p => ({
    value: p.id,
    label: p.name,
  }));

  // Totals for the report
  const totalQuantity = reportData.reduce((sum, r) => sum + r.total_quantity_sold, 0);
  const totalRevenue = reportData.reduce((sum, r) => sum + r.total_revenue, 0);
  const topProduct = reportData.length > 0 
    ? reportData.reduce((prev, current) => (prev.total_quantity_sold > current.total_quantity_sold) ? prev : current)
    : { product_name: "N/A" };

  // Chart Config
  const barChartData = {
    labels: reportData.map(r => r.product_name),
    datasets: [{
      label: 'Quantity Sold',
      data: reportData.map(r => r.total_quantity_sold),
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
    }]
  };

  const lineChartData = {
    labels: chartData.map(r => r.sale_date),
    datasets: [{
      label: 'Revenue ($)',
      data: chartData.map(r => r.total_revenue),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#fff' } },
      title: { display: false, text: 'Chart', color: '#fff' },
    },
    scales: {
      x: { ticks: { color: '#ccc' }, grid: { color: '#444' } },
      y: { ticks: { color: '#ccc' }, grid: { color: '#444' } },
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
      <h2>Sales & Stock Management</h2>
      
      {/* Summary Cards */}
      <div className="grid-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="dashboard-card" style={{ textAlign: "center", padding: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#aaa" }}>Total Revenue</h4>
            <h2 style={{ margin: 0, color: "#4caf50" }}>${totalRevenue.toFixed(2)}</h2>
        </div>
        <div className="dashboard-card" style={{ textAlign: "center", padding: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#aaa" }}>Total Quantity</h4>
            <h2 style={{ margin: 0, color: "#2196f3" }}>{totalQuantity}</h2>
        </div>
        <div className="dashboard-card" style={{ textAlign: "center", padding: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#aaa" }}>Top Product</h4>
            <h2 style={{ margin: 0, color: "#ff9800", fontSize: "1.2rem" }}>{topProduct.product_name}</h2>
        </div>
      </div>
      
      {message && (
        <div style={{ 
          padding: "12px", 
          backgroundColor: "rgba(0, 128, 0, 0.2)", 
          border: "1px solid green", 
          color: "#fff", 
          borderRadius: "6px",
          marginBottom: "24px"
        }}>
          {message}
        </div>
      )}

      <div className="sales-layout">
        {/* Card 1: Record Sale */}
        <div className="dashboard-card">
          <h3>Record Sale</h3>
          <form onSubmit={handleSale}>
            <div className="input-group">
              <label>Select Product</label>
              <Select
                value={selectedProduct}
                onChange={setSelectedProduct}
                options={productOptions}
                placeholder="Search product..."
                isClearable
                styles={selectStyles}
              />
            </div>
            <div className="input-group">
              <label>Quantity</label>
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <button type="submit" style={{ width: "100%" }}>Add Sale</button>
          </form>
        </div>

        {/* Card 2: Quick Stock Update */}
        <div className="dashboard-card">
          <h3>Quick Stock Update</h3>
          <form onSubmit={handleStockUpdate}>
            <div className="input-group">
              <label>Select Product</label>
              <Select
                value={selectedProduct}
                onChange={setSelectedProduct}
                options={productOptions}
                placeholder="Search product..."
                isClearable
                styles={selectStyles}
              />
            </div>
            <div className="input-group">
              <label>Add Stock</label>
              <input
                type="number"
                value={stockQty}
                min="1"
                onChange={(e) => setStockQty(e.target.value)}
                required
              />
            </div>
            <button type="submit" style={{ width: "100%" }}>Update Stock</button>
          </form>
        </div>
      </div>

      <button 
        onClick={() => setShowReports(!showReports)} 
        className="secondary"
        style={{ width: "100%", marginBottom: "24px" }}
      >
        {showReports ? "Hide Reports & Analytics" : "Show Reports & Analytics"}
      </button>

      {showReports && (
        <>
      {/* Card 3: Sales Report */}
      <div className="dashboard-card">
        <h3>Sales Report</h3>
        
        <div className="grid-form" style={{ marginBottom: "24px", alignItems: "end" }}>
          <div className="input-group">
            <label>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Filter by Product</label>
            <Select
              value={filterProduct}
              onChange={setFilterProduct}
              options={filterOptions}
              placeholder="All Products"
              isClearable
              styles={selectStyles}
            />
          </div>
          <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: 0, gap: "10px", flexWrap: "wrap" }}>
             <button onClick={fetchReport} className="secondary" style={{ flex: 1, minWidth: "120px" }}>
               Generate Report
             </button>
             <button onClick={downloadCSV} className="outline" style={{ flex: 1, minWidth: "120px" }}>
               Download CSV
             </button>
          </div>
        </div>

        {reportData.length === 0 ? (
          <p>No sales found for the selected period.</p>
        ) : (
          <div className="table-container">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Qty Sold</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.product_id}>
                      <td>{r.product_name}</td>
                      <td>{r.total_quantity_sold}</td>
                      <td>${r.total_revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold", backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <td style={{ textAlign: "right" }}>TOTAL</td>
                    <td>{totalQuantity}</td>
                    <td>${totalRevenue.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Card 4: Sales Analytics (Charts) */}
      {reportData.length > 0 && (
        <div className="dashboard-card">
          <h3>Sales Analytics</h3>
          <div className="grid-form" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            <div style={{ height: "300px" }}>
              <h4 style={{ textAlign: "center", marginBottom: "10px" }}>Quantity by Product</h4>
              <Bar data={barChartData} options={chartOptions} />
            </div>
            <div style={{ height: "300px" }}>
              <h4 style={{ textAlign: "center", marginBottom: "10px" }}>Revenue Over Time</h4>
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}

export default Sales;
