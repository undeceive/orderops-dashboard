import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("Loading dashboard...");

  async function loadDashboard() {
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE}/api/products`),
        fetch(`${API_BASE}/api/orders`),
      ]);

      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();

      setProducts(productsData.products || []);
      setOrders(ordersData.orders || []);
      setStatus("Connected to OrderOps API");
    } catch (error) {
      setStatus("Could not connect to backend API");
      console.error(error);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalInventory = products.reduce(
    (sum, product) => sum + Number(product.inventory_count || 0),
    0
  );

  const readyOrders = orders.filter(
    (order) => order.order_status === "Ready to Ship"
  ).length;

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">Marketplace Sync Dashboard</p>
        <h1>OrderOps Dashboard</h1>
        <p className="heroText">
          A Walmart-style marketplace operations dashboard for tracking products,
          inventory, orders, and listing status across e-commerce channels.
        </p>

        <div className="statusPill">{status}</div>
      </section>

      <section className="statsGrid">
        <div className="statCard">
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>

        <div className="statCard">
          <span>Total Inventory</span>
          <strong>{totalInventory}</strong>
        </div>

        <div className="statCard">
          <span>Orders</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="statCard">
          <span>Ready to Ship</span>
          <strong>{readyOrders}</strong>
        </div>
      </section>

      <section className="dashboardGrid">
        <div className="panel">
          <div className="panelHeader">
            <h2>Products</h2>
            <span>{products.length} total</span>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Inventory</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.sku}</td>
                    <td>{product.product_name}</td>
                    <td>{product.brand || "—"}</td>
                    <td>{product.inventory_count}</td>
                    <td>
                      <span className="badge">{product.image_status}</span>
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <h2>Orders</h2>
            <span>{orders.length} total</span>
          </div>

          <div className="orderList">
            {orders.map((order) => (
              <article className="orderCard" key={order.id}>
                <div>
                  <h3>{order.marketplace_order_id}</h3>
                  <p>{order.marketplace}</p>
                </div>

                <div className="orderRight">
                  <span className="badge">{order.order_status}</span>
                  <strong>${Number(order.total_amount || 0).toFixed(2)}</strong>
                </div>
              </article>
            ))}

            {orders.length === 0 && (
              <p className="empty">No marketplace orders found.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
