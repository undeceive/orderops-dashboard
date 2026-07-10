import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [issues, setIssues] = useState([]);
  const [status, setStatus] = useState("Loading dashboard...");

  async function loadDashboard() {
    try {
      const [productsResponse, ordersResponse, listingsResponse, issuesResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/orders`),
          fetch(`${API_BASE}/api/listings`),
          fetch(`${API_BASE}/api/sync-issues`),
        ]);

      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();
      const listingsData = await listingsResponse.json();
      const issuesData = await issuesResponse.json();

      setProducts(productsData.products || []);
      setOrders(ordersData.orders || []);
      setListings(listingsData.listings || []);
      setIssues(issuesData.issues || []);
      setStatus("Connected to OrderOps API");
    } catch (error) {
      setStatus("Could not connect to backend API");
      console.error(error);
    }
  }

  async function resolveIssue(issueId) {
    try {
      await fetch(`${API_BASE}/api/sync-issues/${issueId}/resolve`, {
        method: "PATCH",
      });

      await loadDashboard();
    } catch (error) {
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

  const openIssues = issues.filter((issue) => issue.issue_status !== "Resolved");
  const priceMismatches = listings.filter(
    (listing) => listing.sync_status === "Price Mismatch"
  ).length;

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">Marketplace Operations Dashboard</p>
        <h1>OrderOps Dashboard</h1>
        <p className="heroText">
          A daily operations board for tracking products, Walmart listings,
          orders, inventory differences, price mismatches, and marketplace issues
          that need attention.
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
          <span>Open Issues</span>
          <strong>{openIssues.length}</strong>
        </div>

        <div className="statCard">
          <span>Ready to Ship</span>
          <strong>{readyOrders}</strong>
        </div>
      </section>

      <section className="attentionPanel">
        <div>
          <p className="eyebrow">Needs Attention</p>
          <h2>Today’s marketplace problems</h2>
          <p>
            Quick view of listing issues Charles or the team would want to check
            before orders, pricing, or inventory problems pile up.
          </p>
        </div>

        <div className="attentionStats">
          <div>
            <span>Open Issues</span>
            <strong>{openIssues.length}</strong>
          </div>
          <div>
            <span>Price Mismatches</span>
            <strong>{priceMismatches}</strong>
          </div>
        </div>
      </section>

      <section className="dashboardGrid">
        <div className="panel">
          <div className="panelHeader">
            <h2>Sync Issues</h2>
            <span>{issues.length} total</span>
          </div>

          <div className="issueList">
            {issues.map((issue) => (
              <article className="issueCard" key={issue.id}>
                <div>
                  <div className="issueTopLine">
                    <span className="badge warning">{issue.issue_type}</span>
                    <span className="badge">{issue.issue_severity}</span>
                    <span
                      className={
                        issue.issue_status === "Resolved"
                          ? "badge resolved"
                          : "badge open"
                      }
                    >
                      {issue.issue_status}
                    </span>
                  </div>

                  <h3>{issue.sku}</h3>
                  <p>{issue.product_name}</p>
                  <p>{issue.issue_notes || "No notes added."}</p>
                  <small>
                    {issue.marketplace || "No marketplace"} ·{" "}
                    {issue.marketplace_sku || "No marketplace SKU"}
                  </small>
                </div>

                {issue.issue_status !== "Resolved" && (
                  <button onClick={() => resolveIssue(issue.id)}>
                    Mark Resolved
                  </button>
                )}
              </article>
            ))}

            {issues.length === 0 && (
              <p className="empty">No sync issues found.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panelHeader">
            <h2>Marketplace Listings</h2>
            <span>{listings.length} total</span>
          </div>

          <div className="listingList">
            {listings.map((listing) => (
              <article className="listingCard" key={listing.id}>
                <div>
                  <h3>{listing.marketplace}</h3>
                  <p>{listing.marketplace_sku}</p>
                  <small>{listing.product_name}</small>
                </div>

                <div className="listingRight">
                  <span className="badge warning">{listing.sync_status}</span>
                  <strong>${Number(listing.listing_price || 0).toFixed(2)}</strong>
                  <small>Qty {listing.listing_inventory}</small>
                </div>
              </article>
            ))}

            {listings.length === 0 && (
              <p className="empty">No marketplace listings found.</p>
            )}
          </div>
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
