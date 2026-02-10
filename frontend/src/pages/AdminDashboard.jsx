import { useEffect, useMemo, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

import { useTourismState } from "../state/StateContext.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const inr = new Intl.NumberFormat("en-IN");
const currencyINR = (value) => `₹${inr.format(Math.max(0, Math.round(Number(value) || 0)))}`;

export default function Analytics() {
  const { selected } = useTourismState();
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  // Load sites for selected state
  useEffect(() => {
    if (!selected) {
      setSites([]);
      return;
    }
    fetch(`/api/sites?state=${selected}`)
      .then(r => r.json())
      .then(d => setSites(Array.isArray(d.sites) ? d.sites : []))
      .catch((err) => {
        console.error('Failed to load sites', err);
        setSites([]);
      });
  }, [selected]);

  // Load analytics based on selected site
  useEffect(() => {
    let url = "/api/analytics";
    if (siteId) url += `?siteId=${siteId}`;

    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch((err) => {
        console.error('Failed to load analytics', err);
        setData(null);
      });
  }, [siteId]);

  useEffect(() => {
    if (!selected) {
      setProducts([]);
      return;
    }
    let url = "/api/marketplace";
    if (selected) url += `?state=${selected}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d.items) ? d.items : []))
      .catch((err) => {
        console.error('Failed to load products', err);
        setProducts([]);
      });
  }, [selected]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const cartSummary = useMemo(() => cart.reduce((acc, item) => {
    const qty = Number(item.qty) || 1;
    acc.count += qty;
    acc.total += (Number(item.price) || 0) * qty;
    return acc;
  }, { count: 0, total: 0 }), [cart]);

  const highlightProducts = useMemo(() => {
    if (data?.featuredProducts?.length) {
      return data.featuredProducts.slice(0, 6);
    }
    return products.slice(0, 6);
  }, [data, products]);

  function addToCart(product) {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        const existing = updated[idx];
        updated[idx] = { ...existing, qty: (existing.qty || 1) + 1 };
        return updated;
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  if (!data) return <div>Loading...</div>;

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const topSites = data.topSites || [];

  return (
    <div style={{ padding: "20px", fontFamily: "Poppins" }}>
      <h1 style={{ fontSize: "26px", fontWeight: "600", marginBottom: "20px" }}>
        📊 Analytics Dashboard
      </h1>

      {/* Site Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px", fontSize: "14px" }}>
          Select Site:
        </label>
        <select
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #aaa" }}
        >
          <option value="">All Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <Card label="Visitors (last month)" value={data.visitorsByMonth.at(-1)} />
        <Card label="Top Site" value={topSites[0]?.name || "N/A"} />
        <Card label="Avg Rating" value={(avg(data.sentimentTrend)).toFixed(1)} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "10px" }}>
          <h3 style={{ marginBottom: "10px" }}>Visitors by Month</h3>
          <Line
            data={{
              labels: months,
              datasets: [
                {
                  label: "Visitors",
                  data: data.visitorsByMonth,
                  borderColor: "#0d9488",
                  backgroundColor: "rgba(13,148,136,0.2)"
                }
              ]
            }}
          />
        </div>

        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "10px" }}>
          <h3 style={{ marginBottom: "10px" }}>Top Sites by Visits</h3>
          <Bar
            data={{
              labels: topSites.map((s) => s.name),
              datasets: [
                {
                  label: "Visits",
                  data: topSites.map((s) => s.visits),
                  backgroundColor: "#60a5fa"
                }
              ]
            }}
          />
        </div>
      </div>

      <section style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Marketplace Highlights</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
              Spotlight local products from analytics — add them straight to the shared cart.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", color: "#475569" }}>Items in cart: <b>{cartSummary.count}</b></div>
            <div style={{ fontSize: "13px", color: "#475569" }}>Cart value: <b>{currencyINR(cartSummary.total)}</b></div>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: highlightProducts.length >= 3
            ? "repeat(3, minmax(0, 1fr))"
            : `repeat(${Math.max(highlightProducts.length, 1)}, minmax(0, 1fr))`,
          gap: "18px"
        }}>
          {highlightProducts.length ? highlightProducts.map((item) => (
            <div key={item.id} style={{
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              background: "#fff",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
              minHeight: "320px"
            }}>
              <div style={{ height: "150px", borderRadius: "10px", overflow: "hidden", background: "#f1f5f9" }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "12px" }}>
                    No image available
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>{item.name}</div>
                <div style={{ fontSize: "13px", color: "#047857", fontWeight: 600, marginTop: "4px" }}>
                  {currencyINR(item.price)}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                  {item.description || "Authentic local craft curated for conscious travellers."}
                </div>
              </div>

              <button
                onClick={() => addToCart(item)}
                style={{
                  marginTop: "auto",
                  background: "#0f766e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Add to Cart
              </button>
            </div>
          )) : (
            <div style={{
              gridColumn: "1 / -1",
              border: "1px dashed #cbd5f5",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              color: "#475569"
            }}>
              No marketplace insights available for the current selection yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div style={{
      padding: "15px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      flex: 1,
      background: "#fafafa"
    }}>
      <div style={{ fontSize: "14px", color: "#555" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: "600" }}>{value}</div>
    </div>
  );
}

function avg(arr) {
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}
