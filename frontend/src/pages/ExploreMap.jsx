// src/pages/ExploreMap.jsx
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import { useTourismState } from '../state/StateContext.jsx'

const currencyINR = new Intl.NumberFormat('en-IN')
const formatMoney = (value) => (Number.isFinite(Number(value)) ? `₹${currencyINR.format(Math.round(Number(value)))}` : '—')
const placeLabel = (category) => {
  if (category === 'culture') return 'Historical & Cultural Place'
  if (category === 'nature') return 'Tourist Nature Spot'
  if (category === 'adventure') return 'Adventure Destination'
  return 'Tourist Place'
}

export default function ExploreMap() {
  const { selected, states: stateList } = useTourismState()
  const [sites, setSites] = useState([])
  const [category, setCategory] = useState('all')
  const [position, setPosition] = useState(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [route, setRoute] = useState(null)
  const [eta, setEta] = useState(null)
  const [traffic, setTraffic] = useState('Moderate')
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const stateCenter = stateList.find((s) => s.name === selected)?.center || [23.3441, 85.3096]

  useEffect(() => {
    if (!selected) {
      setSites([])
      return
    }
    const params = new URLSearchParams({ state: selected })
    fetch(`/api/sites?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => {
        const sitesList = Array.isArray(d.sites) ? d.sites : (d.sites ? [d.sites] : [])
        setSites(sitesList)
      })
      .catch((err) => {
        console.error('Failed to load sites', err)
        setSites([])
      })
  }, [selected])

  const filtered = useMemo(() => {
    if (category === 'all') return sites
    return sites.filter((s) => s.category === category)
  }, [sites, category])

  const guideSpotlight = selectedSite?.tourGuides?.length
    ? selectedSite.tourGuides
    : filtered[0]?.tourGuides || []

  function locate() {
    if (!navigator.geolocation) return alert('Geolocation not supported')
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([pos.coords.latitude, pos.coords.longitude])
    }, (err) => {
      console.warn('Geolocation error', err)
      alert('Could not get your location: ' + (err.message || 'Permission denied'))
    })
  }

  useEffect(() => {
    async function fetchRoute() {
      if (!position || !selectedSite) {
        setRoute(null)
        setEta(null)
        return
      }
      try {
        const from = `${position[1]},${position[0]}`
        const to = `${selectedSite.lng},${selectedSite.lat}`
        const url = `https://router.project-osrm.org/route/v1/driving/${from};${to}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        const coords = data?.routes?.[0]?.geometry?.coordinates || []
        if (coords.length) {
          setRoute(coords.map(([lng, lat]) => [lat, lng]))
          const seconds = Math.round(data.routes[0].duration || 0)
          setEta(`${Math.floor(seconds / 60)} min`)
        } else {
          setRoute(null)
          setEta(null)
        }
      } catch (err) {
        console.warn('Route fetch failed', err)
        setRoute(null)
        setEta(null)
      }
      const levels = ['Light', 'Moderate', 'Heavy']
      setTraffic(levels[Math.floor(Math.random() * levels.length)])
    }
    fetchRoute()
  }, [position, selectedSite])

  // stop body scroll when modal opens
  useEffect(() => {
    if (selectedSite) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev || '' }
    }
  }, [selectedSite])

  async function openDetails(s) {
    setLoadingReviews(true)
    try {
      const res = await fetch(`/api/sites/${s.id}/reviews`)
      const json = await res.json()
      setReviews(Array.isArray(json.reviews) ? json.reviews : [])
    } catch (err) {
      console.warn('Failed to load reviews', err)
      setReviews([])
    } finally {
      setLoadingReviews(false)
      setSelectedSite(s)
    }
  }

  function statusFor(site) {
    const h = new Date().getHours()
    const open = h >= 8 && h <= 18
    const crowds = ['Low', 'Medium', 'High']
    return { open, crowd: crowds[(site.id?.length || 0 + h) % 3] }
  }

  return (
    <div className="explore-map-page" style={{ maxWidth: '1400px', margin: '30px auto', padding: '20px', minHeight: 'calc(100vh - 120px)' }}>
      <div className="map-header card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', padding: '24px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="header-icon-wrapper bg-primary bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-map text-primary" style={{ fontSize: '2rem' }}></i>
              </div>
              <div>
                <h1 className="fw-bold mb-1" style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Interactive Map
                </h1>
                <p className="text-muted mb-0">Explore eco, cultural and adventure spots with travel info</p>
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="form-select form-select-sm"
              style={{ borderRadius: '20px', minWidth: '150px', border: '1px solid #dee2e6' }}
            >
              <option value="all">All Categories</option>
              <option value="nature">Nature</option>
              <option value="culture">Culture</option>
              <option value="adventure">Adventure</option>
            </select>
            <button 
              onClick={locate} 
              className="btn btn-primary btn-sm rounded-pill"
              style={{ whiteSpace: 'nowrap' }}
            >
              <i className="bi bi-geo-alt-fill me-2"></i>
              My Location
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <MapContainer center={stateCenter} zoom={8} style={{ height: '80vh', width: '100%' }} key={selected || 'map'}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {filtered.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} eventHandlers={{ click: () => openDetails(s) }}>
                <Popup>
                  <div style={{ maxWidth: '240px' }}>
                    <h4 style={{ fontWeight: 600 }}>{s.name}</h4>
                    <div style={{ width: '100%', height: '120px', borderRadius: '6px', marginTop: '5px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {s.image && s.image.trim() ? (
                        <img 
                          src={s.image} 
                          alt={s.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{ display: s.image && s.image.trim() ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', padding: '10px', textAlign: 'center' }}>
                        Image coming soon
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#555', marginTop: '5px' }}>{s.description}</p>
                    <p style={{ fontSize: '12px', color: '#667085', marginTop: '4px', marginBottom: '4px' }}>
                      {placeLabel(s.category)} · {s.entryFee?.label || 'Entry details on arrival'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>Status: <b>{statusFor(s).open ? 'Open' : 'Closed'}</b> · Crowd: <b>{statusFor(s).crowd}</b></p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {position && <Marker position={position}><Popup><b>You are here</b></Popup></Marker>}
            {route && <Polyline positions={route} pathOptions={{ color: '#16a34a', weight: 5, opacity: 0.7 }} />}
          </MapContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', padding: '20px' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-info-circle-fill text-primary"></i>
              <h5 className="fw-bold mb-0">Travel Info</h5>
            </div>
            <div className="mb-2">
              <span className="text-muted small">Traffic: </span>
              <span className="badge bg-warning text-dark">{traffic}</span>
            </div>
            {selectedSite && position ? (
              <div className="mb-2">
                <span className="text-muted small">Route: </span>
                <b className="text-primary">{eta || '…'}</b>
                <span className="text-muted small"> to {selectedSite.name}</span>
              </div>
            ) : (
              <div className="text-muted small">
                Select a site and click <b>Details</b> to open modal (or click a marker)
              </div>
            )}
            <p className="small text-muted mt-3 mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Traffic and crowd levels are estimated for demo purposes.
            </p>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', padding: '20px' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-person-badge-fill text-primary"></i>
              <h5 className="fw-bold mb-0">Tour Guides</h5>
            </div>
            {guideSpotlight.length ? (
              <div className="d-flex flex-column gap-3">
                {guideSpotlight.map((guide) => (
                  <div key={guide.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                    <div className="fw-bold">{guide.name}</div>
                    <div className="small text-muted mt-1">{guide.speciality}</div>
                    <div className="small mt-2">
                      <i className="bi bi-translate me-1"></i>
                      {Array.isArray(guide.languages) ? guide.languages.join(', ') : 'English, Hindi'}
                    </div>
                    <div className="small mt-1">
                      <i className="bi bi-award me-1"></i>
                      {guide.experienceYears || 0}+ years experience
                    </div>
                    <div className="small mt-1 fw-semibold text-primary">
                      <i className="bi bi-currency-rupee me-1"></i>
                      {formatMoney(guide.priceINR)} / day
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="small text-muted">Select a place to see local guide recommendations.</div>
            )}
          </div>

          <div className="sites-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)', paddingRight: '8px' }}>
            {filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-map text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                <p className="text-muted mt-3 mb-0">
                  {sites.length === 0 ? 'No sites available for this state.' : `No sites found in "${category}" category.`}
                </p>
              </div>
            ) : null}
            {filtered.map((s) => (
              <div 
                key={s.id} 
                className="site-card card border-0 shadow-sm mb-3"
                style={{ 
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ width: 90, height: 70, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.image && s.image.trim() ? (
                    <img 
                      src={s.image} 
                      alt={s.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ display: s.image && s.image.trim() ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px', padding: '5px', textAlign: 'center' }}>
                    No image
                  </div>
                </div>
                <div className="card-body p-3" style={{ flex: 1 }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="fw-bold mb-1">{s.name}</h6>
                      <span className="badge bg-primary bg-opacity-10 text-primary small">{s.category || 'General'}</span>
                    </div>
                  </div>
                  <div className="small fw-semibold text-primary mb-2">{placeLabel(s.category)}</div>
                  <p className="text-muted small mb-3" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {s.description?.length > 100 ? s.description.substring(0, 100) + '...' : s.description}
                  </p>
                  <div className="small text-muted mb-2">
                    <i className="bi bi-ticket-perforated me-1"></i>
                    <b>Estimated entry:</b> {s.entryFee?.label || 'Check locally'}
                  </div>
                  {s.localSpecialities?.[0] ? (
                    <div className="small text-muted mb-3">
                      <i className="bi bi-bag-heart me-1"></i>
                      <b>Local speciality:</b> {s.localSpecialities[0].name} · {formatMoney(s.localSpecialities[0].priceINR)}
                    </div>
                  ) : null}
                  <div className="d-flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedSite(s)
                        const destination = `${s.lat},${s.lng}`
                        let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
                        if (position && position.length === 2) {
                          const origin = `${position[0]},${position[1]}`
                          url += `&origin=${encodeURIComponent(origin)}`
                        }
                        window.open(url, '_blank', 'noopener')
                      }} 
                      className="btn btn-sm btn-outline-secondary"
                      style={{ borderRadius: '20px', fontSize: '12px' }}
                    >
                      <i className="bi bi-navigation me-1"></i>
                      Directions
                    </button>
                    <button 
                      onClick={() => openDetails(s)} 
                      className="btn btn-sm btn-primary"
                      style={{ borderRadius: '20px', fontSize: '12px' }}
                    >
                      <i className="bi bi-info-circle me-1"></i>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedSite && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '24px' }}>
          <div className="modal-content card border-0 shadow-lg" style={{ width: '90%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '20px', backgroundColor: '#ffffff', backgroundImage: 'none', color: '#0f172a', border: '1px solid rgba(15,23,42,0.08)' }}>
            <div className="card-header bg-transparent border-0 p-4 pb-0">
              <div className="d-flex justify-content-between align-items-start">
                <div style={{ flex: 1 }}>
                  <h2 className="fw-bold mb-2" style={{ fontSize: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {selectedSite.name}
                  </h2>
                  <p className="text-muted mb-0">{selectedSite.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedSite(null)} 
                  className="btn btn-sm btn-link text-muted p-0"
                  style={{ minWidth: 'auto', fontSize: '1.5rem' }}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            </div>
            <div className="card-body p-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
              <div>
                <div style={{ width: '100%', height: '260px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px' }}>
                  {selectedSite.image && selectedSite.image.trim() ? (
                    <img 
                      src={selectedSite.image} 
                      alt={selectedSite.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ display: selectedSite.image && selectedSite.image.trim() ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
                    Image coming soon
                  </div>
                </div>
                <section style={{ marginTop: '12px' }}>
                  <h4 style={{ marginBottom: '6px' }}>History & Significance</h4>
                  <p style={{ color: '#444' }}>{selectedSite.history || 'No detailed history available.'}</p>
                </section>

                <section style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '8px' }}>Local Specialities</h4>
                  {selectedSite.localSpecialities && selectedSite.localSpecialities.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
                      {selectedSite.localSpecialities.map((item) => (
                        <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', background: '#fff' }}>
                          <div style={{ height: '120px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div style={{ display: item.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '12px' }}>
                              Local speciality
                            </div>
                          </div>
                          <div style={{ padding: '12px' }}>
                            <div className="fw-bold" style={{ fontSize: '14px' }}>{item.name}</div>
                            <div className="small text-muted mt-1" style={{ lineHeight: '1.5' }}>{item.description}</div>
                            <div className="small text-primary fw-semibold mt-2">{formatMoney(item.priceINR)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#444' }}>No local specialities available right now.</p>
                  )}
                </section>

                <section style={{ marginTop: '12px' }}>
                  <h4 style={{ marginBottom: '6px' }}>Famous Foods</h4>
                  {selectedSite.famousFoods && selectedSite.famousFoods.length ? (
                    <ul style={{ marginLeft: '18px' }}>{selectedSite.famousFoods.map((f, i) => <li key={i}><b>{f.name}:</b> {f.description}</li>)}</ul>
                  ) : (<p style={{ color: '#444' }}>No data on local foods.</p>)}
                </section>

                <section style={{ marginTop: '12px' }}>
                  <h4 style={{ marginBottom: '6px' }}>Hotels & Restaurants</h4>
                  {selectedSite.hotels && selectedSite.hotels.length ? (
                    <ul style={{ marginLeft: '18px' }}>{selectedSite.hotels.map((h, i) => <li key={i}><b>{h.name}</b> — {h.type} — ₹{h.priceINR}</li>)}</ul>
                  ) : (<p style={{ color: '#444' }}>No local hotels/restaurants listed.</p>)}
                </section>
              </div>

              <aside style={{ borderLeft: '1px solid #eee', paddingLeft: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ marginBottom: '6px' }}>Quick Info</h4>
                  <div>Type: <b>{placeLabel(selectedSite.category)}</b></div>
                  <div>Category: <b>{selectedSite.category || '—'}</b></div>
                  <div>Entry Price: <b>{selectedSite.entryFee?.label || '—'}</b></div>
                  <div>Estimated Cost (per night): <b>{selectedSite.estimatedStayCost ? `₹${selectedSite.estimatedStayCost}` : '—'}</b></div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ marginBottom: '8px' }}>Recommended Tour Guides</h4>
                  {selectedSite.tourGuides?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedSite.tourGuides.map((guide) => (
                        <div key={guide.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#f8fafc' }}>
                          <div className="fw-bold" style={{ fontSize: '14px' }}>{guide.name}</div>
                          <div className="small text-muted mt-1">{guide.speciality}</div>
                          <div className="small mt-2">
                            <i className="bi bi-translate me-1"></i>
                            {Array.isArray(guide.languages) ? guide.languages.join(', ') : 'English, Hindi'}
                          </div>
                          <div className="small mt-1">
                            <i className="bi bi-award me-1"></i>
                            {guide.experienceYears || 0}+ years
                          </div>
                          <div className="small fw-semibold text-primary mt-1">
                            <i className="bi bi-currency-rupee me-1"></i>
                            {formatMoney(guide.priceINR)} / day
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="small text-muted">Guide details will appear here for selected places.</div>
                  )}
                </div>

                <div>
                  <h4 style={{ marginBottom: '6px' }}>Traveler Reviews</h4>
                  {loadingReviews ? <div>Loading reviews…</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {reviews.length ? reviews.map((r, idx) => {
                        const ratingValue = Number.isFinite(Number(r.rating))
                          ? Number(r.rating).toFixed(1)
                          : '—';
                        return (
                          <div key={idx} style={{ border: '1px solid #f0f0f0', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>
                            {r.name || r.author || 'Anonymous'} <span style={{ fontWeight: 400, color: '#777' }}>· {ratingValue}/5</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#333' }}>{r.text || r.comment || 'No review text provided.'}</div>
                          {r.createdAt ? (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          ) : null}
                        </div>
                        );
                      }) : <div style={{ color: '#666' }}>No reviews yet. Be the first!</div>}
                    </div>
                  )}
                </div>
              </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
