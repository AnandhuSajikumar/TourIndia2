// src/pages/Marketplace.jsx
import { useEffect, useMemo, useState } from 'react'
import { useTourismState } from '../state/StateContext.jsx'

export default function Marketplace() {
  const { selected } = useTourismState()
  const [items, setItems] = useState([])
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })

  const [processing, setProcessing] = useState(false)
  const [filter, setFilter] = useState('all')

  // Store quantity selection per product
  const [qty, setQty] = useState({})

  // Cart total
  const total = useMemo(() => cart.reduce((s, i) => s + (i.price * i.qty), 0), [cart])

  // Get unique categories from items
  const categories = useMemo(() => {
    const cats = new Set(['all'])
    items.forEach(item => {
      if (item.category) cats.add(item.category.toLowerCase())
    })
    return Array.from(cats).sort()
  }, [items])

  useEffect(() => {
    const params = new URLSearchParams({ state: selected })
    fetch(`/api/marketplace?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch((err) => {
        console.error('Failed to load products', err)
        setItems([])
      })
  }, [selected])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // ---------------------------
  // Quantity Selector
  // ---------------------------
  function updateQty(id, change) {
    setQty((prev) => {
      const newValue = Math.max(1, (prev[id] || 1) + change)
      return { ...prev, [id]: newValue }
    })
  }

  // ---------------------------
  // Add to Cart
  // ---------------------------
  function addToCart(product) {
    const count = qty[product.id] || 1

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === product.id)

      if (idx >= 0) {
        const updated = [...prev]
        updated[idx].qty += count
        return updated
      }

      return [...prev, { ...product, qty: count }]
    })
  }

  // ---------------------------
  // Update cart quantity inside cart
  // ---------------------------
  function changeCartQty(id, change) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + change) } : item
      )
    )
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((x) => x.id !== id))
  }

  // ---------------------------
  // Checkout
  // ---------------------------
  async function checkout() {
    if (!cart.length) return
    setProcessing(true)

    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total * 100, currency: 'INR', items: cart })
      })

      const orderData = await orderRes.json()

      const proceed = confirm(
        `Order ID: ${orderData.orderId}\nAmount: ₹${total}\n\nProceed with payment?`
      )

      if (proceed) {
        await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: `demo_${Date.now()}`,
            signature: 'demo'
          })
        })

        alert('Payment Successful!')
        setCart([])
      }
    } catch {
      alert('Payment failed.')
    } finally {
      setProcessing(false)
    }
  }

  // ---------------------------
  // Category Filter
  // ---------------------------
  const visible = useMemo(() => items.filter((i) =>
    filter === 'all' ? true : (i.category || '').toLowerCase() === filter
  ), [items, filter])

  return (
    <div className="marketplace-page" style={{
      fontFamily: 'Poppins, sans-serif',
      padding: '20px',
      minHeight: 'calc(100vh - 120px)',
      background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'
    }}>
      <div className="marketplace-header mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <div className="header-icon-wrapper">
            <i className="bi bi-shop text-primary" style={{ fontSize: '2.5rem' }}></i>
          </div>
          <div>
            <h1 className="fw-bold mb-1" style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Marketplace
            </h1>
            <p className="text-muted mb-0">Discover authentic local products and support artisans</p>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="category-filters mb-4">
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <span className="small fw-semibold text-muted me-2">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{
                borderRadius: '20px',
                padding: '6px 16px',
                textTransform: 'capitalize',
                transition: 'all 0.3s ease',
                border: filter === cat ? 'none' : '1px solid #dee2e6'
              }}
              onMouseEnter={(e) => {
                if (filter !== cat) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== cat) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              {cat === 'all' ? 'ALL' : cat.replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

        {/* PRODUCTS LIST */}
        <div style={{
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '18px'
          }}>
            {visible.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
                <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                <p className="text-muted mt-3 mb-0 fw-semibold">
                  {items.length === 0 ? 'No products available for this state.' : `No products found in "${filter === 'all' ? 'All' : filter}" category.`}
                </p>
                <small className="text-muted">Try selecting a different category or state</small>
              </div>
            ) : null}
            {visible.map((p) => (
              <div 
                key={p.id} 
                className="product-card card border-0 shadow-sm h-100"
                style={{
                  borderRadius: '16px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '160px',
                  borderRadius: '10px 10px 0 0',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {p.image && p.image.trim() ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    display: p.image && p.image.trim() ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#94a3b8',
                    fontSize: '12px',
                    textAlign: 'center',
                    padding: '10px'
                  }}>
                    Image coming soon
                  </div>
                </div>

                <div className="card-body p-3">
                  <h6 className="fw-bold mb-2" style={{ fontSize: '15px', lineHeight: '1.4' }}>{p.name}</h6>
                  {p.description && (
                    <p className="text-muted small mb-2" style={{ fontSize: '12px', lineHeight: '1.4', minHeight: '32px' }}>
                      {p.description.length > 60 ? p.description.substring(0, 60) + '...' : p.description}
                    </p>
                  )}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <span className="text-muted small">Price</span>
                      <div className="fw-bold text-primary" style={{ fontSize: '18px' }}>
                        ₹{new Intl.NumberFormat('en-IN').format(p.price)}
                      </div>
                    </div>
                    {p.state && (
                      <span className="badge bg-light text-dark small">{p.state}</span>
                    )}
                  </div>

                  {/* QUANTITY CONTROLS */}
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <button
                      onClick={() => updateQty(p.id, -1)}
                      className="btn btn-sm btn-outline-secondary rounded-circle"
                      style={{ width: '32px', height: '32px', padding: 0, lineHeight: '1' }}
                    >−</button>
                    <div style={{ width: '30px', textAlign: 'center', fontWeight: '600' }}>
                      {qty[p.id] || 1}
                    </div>
                    <button
                      onClick={() => updateQty(p.id, +1)}
                      className="btn btn-sm btn-outline-secondary rounded-circle"
                      style={{ width: '32px', height: '32px', padding: 0, lineHeight: '1' }}
                    >+</button>
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    className="btn btn-primary w-100 rounded-pill"
                    style={{
                      fontWeight: '600',
                      padding: '10px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <i className="bi bi-cart-plus me-2"></i>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CART SECTION */}
        <div className="cart-section card border-0 shadow-lg" style={{
          borderRadius: '16px',
          padding: '20px',
          position: 'sticky',
          top: '20px',
          maxHeight: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="cart-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2">
              <i className="bi bi-cart-check text-primary" style={{ fontSize: '1.5rem' }}></i>
            </div>
            <h2 className="fw-bold mb-0" style={{ fontSize: '20px' }}>Your Cart</h2>
            {cart.length > 0 && (
              <span className="badge bg-primary rounded-pill">{cart.length}</span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
            {cart.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-cart-x text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
              <p className="text-muted mt-3 mb-0">Your cart is empty</p>
              <small className="text-muted">Add products to get started</small>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="cart-item card mb-3 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <h6 className="fw-semibold mb-1 small">{item.name}</h6>
                        <div className="text-muted small">₹{new Intl.NumberFormat('en-IN').format(item.price)} each</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="btn btn-sm btn-link text-danger p-0"
                        style={{ minWidth: 'auto' }}
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <button 
                          onClick={() => changeCartQty(item.id, -1)} 
                          className="btn btn-sm btn-outline-secondary rounded-circle"
                          style={{ width: '28px', height: '28px', padding: 0, lineHeight: '1' }}
                        >−</button>
                        <span className="fw-semibold" style={{ minWidth: '30px', textAlign: 'center' }}>{item.qty}</span>
                        <button 
                          onClick={() => changeCartQty(item.id, +1)} 
                          className="btn btn-sm btn-outline-secondary rounded-circle"
                          style={{ width: '28px', height: '28px', padding: 0, lineHeight: '1' }}
                        >+</button>
                      </div>
                      <div className="fw-bold text-primary">
                        ₹{new Intl.NumberFormat('en-IN').format(item.qty * item.price)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <hr className="my-3" />

              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-semibold">Total:</span>
                <span className="fw-bold text-primary" style={{ fontSize: '1.25rem' }}>
                  ₹{new Intl.NumberFormat('en-IN').format(total)}
                </span>
              </div>

              <button
                onClick={checkout}
                disabled={processing || cart.length === 0}
                className="btn btn-primary w-100 rounded-pill"
                style={{
                  fontWeight: '600',
                  padding: '12px',
                  transition: 'all 0.3s ease'
                }}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-credit-card me-2"></i>
                    Checkout
                  </>
                )}
              </button>
            </>
            )}
          </div>

          <div className="mt-3 pt-3 border-top">
            <p className="small text-muted mb-0">
              <i className="bi bi-geo-alt me-1"></i>
              Showing products from: <b>{selected || 'All States'}</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
