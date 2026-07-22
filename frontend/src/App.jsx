/**
 * frontend/src/App.jsx
 *
 * Main React frontend for OrderOps Dashboard.
 *
 * This page connects to the Express backend and displays:
 * - product totals
 * - inventory totals
 * - order totals
 * - marketplace listings
 * - sync issues that need attention
 *
 * The frontend does not directly talk to the SQLite database.
 * It gets all data through the backend API.
 */

import { useEffect, useState } from "react";
import "./App.css";

/**
 * Backend API base URL.
 *
 * During local development:
 * - React/Vite frontend usually runs on http://localhost:5173
 * - Express backend runs on http://localhost:5000
 */
const API_BASE = "http://localhost:5000";

function App() {
  /**
   * React state stores the dashboard data after it is loaded
   * from the backend API.
   */
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [listings, setListings] = useState([]);
  const [issues, setIssues] = useState([]);

  /**
   * Stores the CSV file selected by the user.
   *
   * This is uploaded to the backend import endpoint.
   */
  const [csvFile, setCsvFile] = useState(null);

  /**
   * Shows a message after CSV import succeeds or fails.
   */
  const [importStatus, setImportStatus] = useState("");

  /**
   * Status message shown near the top of the dashboard.
   *
   * This lets the user know whether the frontend successfully connected
   * to the backend.
   */
  const [status, setStatus] = useState("Loading dashboard...");

  /**
   * loadDashboard()
   *
   * Fetches all dashboard data from the backend at the same time.
   *
   * Promise.all is used so the app does not wait for each request one by one.
   * This makes loading faster.
   */
  async function loadDashboard() {
    try {
      const [productsResponse, ordersResponse, listingsResponse, issuesResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/orders`),
          fetch(`${API_BASE}/api/listings`),
          fetch(`${API_BASE}/api/sync-issues`),
        ]);

      /**
       * Convert the API responses into JavaScript objects.
       */
      const productsData = await productsResponse.json();
      const ordersData = await ordersResponse.json();
      const listingsData = await listingsResponse.json();
      const issuesData = await issuesResponse.json();

      /**
       * Save the API data into React state.
       *
       * The "|| []" fallback prevents the app from crashing if an API response
       * is missing a list for some reason.
       */
      setProducts(productsData.products || []);
      setOrders(ordersData.orders || []);
      setListings(listingsData.listings || []);
      setIssues(issuesData.issues || []);
      setStatus("Connected to OrderOps API");
    } catch (error) {
      /**
       * If the backend is not running or a request fails,
       * show a friendly status message instead of a blank page.
       */
      setStatus("Could not connect to backend API");
      console.error(error);
    }
  }

  /**
   * resolveIssue()
   *
   * Sends a PATCH request to the backend to mark a sync issue as resolved.
   *
   * After the issue is updated, the dashboard reloads so the UI shows
   * the newest data.
   */
  /**
   * Uploads a CSV file to the backend import endpoint.
   *
   * The backend reads the file, updates products/listings,
   * creates sync issues, and prevents duplicate open issues.
   */
  async function handleCsvUpload(event) {
    event.preventDefault();

    if (!csvFile) {
      setImportStatus("Please choose a CSV file first.");
      return;
    }

    try {
      setImportStatus("Importing CSV...");

      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await fetch(`${API_BASE}/api/import/listings`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "CSV import failed");
      }

      setImportStatus(
        `CSV imported: ${result.rows} rows, ${result.createdIssues} new issues created.`
      );

      setCsvFile(null);
      await loadDashboard();
    } catch (error) {
      setImportStatus(`Import failed: ${error.message}`);
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

  /**
   * useEffect runs when the page first loads.
   *
   * The empty dependency array [] means:
   * "run this once when the component first appears."
   */
  useEffect(() => {
    loadDashboard();
  }, []);

  /**
   * Calculate total inventory across all products.
   *
   * Example:
   * Product A inventory: 12
   * Product B inventory: 5
   * Total inventory: 17
   */
  const totalInventory = products.reduce(
    (sum, product) => sum + Number(product.inventory_count || 0),
    0
  );

  /**
   * Count orders that are ready to ship.
   *
   * This gives Charles/the team a quick operations number.
   */
  const readyOrders = orders.filter(
    (order) => order.order_status === "Ready to Ship"
  ).length;

  /**
   * Open issues are issues that have not been resolved.
   */
  const openIssues = issues.filter((issue) => issue.issue_status !== "Resolved");

  /**
   * Count listings that have a price mismatch.
   *
   * This is pulled from listing.sync_status.
   */
  const priceMismatches = listings.filter(
    (listing) => listing.sync_status === "Price Mismatch"
  ).length;

  return (
    <main className="app">
      {/* Hero section: title, description, and backend connection status */}
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

      {/* Top statistic cards */}
      <section className="importPanel">
        <div>
          <p className="eyebrow">CSV Import</p>
          <h2>Upload marketplace listing data</h2>
          <p>
            Import a Walmart-style CSV to update products, update listings, and
            automatically create sync issues for price, inventory, or image
            problems.
          </p>
        </div>

        <form className="importForm" onSubmit={handleCsvUpload}>
          <label className="filePicker">
            <span>{csvFile ? csvFile.name : "Choose CSV file"}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setCsvFile(event.target.files[0] || null)}
            />
          </label>

          <button type="submit">Import CSV</button>

          {importStatus && <p className="importStatus">{importStatus}</p>}
        </form>
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

      {/* High-level warning/attention area */}
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

      {/* Main dashboard grid: sync issues and marketplace listings */}
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

                {/* Only show the button when the issue is not already resolved */}
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

      {/* Second dashboard grid: product table and order list */}
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
