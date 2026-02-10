// src/pages/Itinerary.jsx
import { useEffect, useState } from 'react';
import { useTourismState } from '../state/StateContext.jsx';

const slotStyles = {
  travel: {
    icon: '🚌',
    color: '#0369a1',
    background: 'rgba(3,105,161,0.08)',
    borderLeft: '4px solid #0284c7'
  },
  visit: {
    icon: '🧭',
    color: '#047857',
    background: 'rgba(4,120,87,0.08)',
    borderLeft: '4px solid #16a34a'
  },
  food: {
    icon: '🍽️',
    color: '#c2410c',
    background: 'rgba(234,88,12,0.08)',
    borderLeft: '4px solid #f97316'
  },
  rest: {
    icon: '🧘',
    color: '#6366f1',
    background: 'rgba(99,102,241,0.08)',
    borderLeft: '4px solid #4f46e5'
  },
  sleep: {
    icon: '🌙',
    color: '#334155',
    background: 'rgba(51,65,85,0.08)',
    borderLeft: '4px solid #0f172a'
  }
};

const defaultSlotStyle = {
  icon: '🗓️',
  color: '#0f172a',
  background: 'rgba(15,23,42,0.05)',
  borderLeft: '4px solid #64748b'
};

const currencyFormatter = new Intl.NumberFormat('en-IN');

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return '—';
  if (minutes <= 0) return '0 min';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs && mins) return `${hrs} hr ${mins} min`;
  if (hrs) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${mins} min`;
}

function formatDistance(km) {
  if (!Number.isFinite(km) || km <= 0) return '—';
  return `${km.toFixed(1)} km`;
}

function formatMoney(value) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `₹${currencyFormatter.format(Math.round(value))}`;
}

function DayStat({ label, value, caption }) {
  return (
    <div className="day-stat-card card border-0 shadow-sm" style={{
      flex: '1 1 180px',
      minWidth: '160px',
      borderRadius: '12px',
      padding: '16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'
    }}
    >
      <div className="small text-muted fw-semibold mb-2" style={{ fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div className="fw-bold mb-1" style={{ fontSize: '24px', color: '#0f172a' }}>{value}</div>
      {caption ? <div className="small text-muted mt-1" style={{ fontSize: '12px' }}>{caption}</div> : null}
    </div>
  );
}

function MealCard({ title, meal }) {
  if (!meal) return null;
  return (
    <div className="meal-card card border-0 shadow-sm" style={{
      borderRadius: '12px',
      padding: '16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      minHeight: '140px',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'
    }}
    >
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="meal-icon-wrapper bg-primary bg-opacity-10 rounded-circle p-2">
          <i className={`bi ${title === 'Breakfast' ? 'bi-sunrise' : title === 'Lunch' ? 'bi-sun' : 'bi-moon'} text-primary`}></i>
        </div>
        <div className="fw-bold" style={{ fontSize: '15px', color: '#0f172a' }}>{title}</div>
      </div>
      <div className="small text-muted mb-2">{meal.time}</div>
      <div className="fw-semibold mb-1" style={{ fontSize: '14px', color: '#1f2937' }}>{meal.name}</div>
      {meal.description ? (
        <div className="small text-muted mt-2" style={{ fontSize: '12px', lineHeight: '1.5' }}>{meal.description}</div>
      ) : null}
    </div>
  );
}

function TimelineSlot({ slot }) {
  const style = slotStyles[slot.type] || defaultSlotStyle;
  const extraContext = slot.context || (slot.type === 'visit' ? slot.site?.travelTips : null);

  return (
    <div className="timeline-slot card border-0 shadow-sm" style={{
      borderRadius: '12px',
      padding: '16px',
      background: style.background,
      borderLeft: style.borderLeft,
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateX(4px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateX(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div className="d-flex gap-3">
        <div style={{ fontSize: '24px', lineHeight: 1 }}>{style.icon}</div>
        <div style={{ flex: 1 }}>
          <div className="fw-bold mb-1" style={{ color: style.color, fontSize: '15px' }}>{slot.label}</div>
          <div className="small text-muted mb-2">
            {slot.start} – {slot.end} · {formatMinutes(slot.minutes)}
          </div>
          {slot.type === 'travel' && Number.isFinite(slot.distanceKm) ? (
            <div className="small mb-2">
              <i className="bi bi-signpost-2 me-1"></i>
              Distance: {formatDistance(slot.distanceKm)}
            </div>
          ) : null}
          {extraContext ? (
            <div className="small mt-2" style={{ color: '#1f2937', lineHeight: '1.5' }}>{extraContext}</div>
          ) : null}
          {slot.type === 'visit' && slot.site?.famousFoods?.length ? (
            <div className="mt-2">
              <span className="badge bg-warning bg-opacity-10 text-warning small">
                <i className="bi bi-egg-fried me-1"></i>
                Must try: {slot.site.famousFoods.slice(0, 2).map((food) => food.name).join(', ')}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Itinerary() {
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState('medium');
  const [interest, setInterest] = useState('all');
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maxDaysAvailable, setMaxDaysAvailable] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const { selected } = useTourismState();

  async function generate() {
    if (!selected) {
      setPlanData(null);
      setError(null);
      setMaxDaysAvailable(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days, budget, interest, state: selected });
      if (origin?.lat && origin?.lng) {
        params.append('originLat', origin.lat);
        params.append('originLng', origin.lng);
      }
      const res = await fetch(`/api/itinerary?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setPlanData(null);
        setError(data.error || 'Itinerary not available for the selected duration.');
        if (typeof data.maxDays === 'number') {
          setMaxDaysAvailable(data.maxDays);
        }
      } else {
        setPlanData(data);
        setMaxDaysAvailable(
          typeof data.maxDaysAvailable === 'number' ? data.maxDaysAvailable : null
        );
      }
    } catch (err) {
      console.error('Failed itinerary', err);
      setPlanData(null);
      setError('Unable to generate itinerary right now. Please try again in a bit.');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!selected) {
      setPlanData(null);
      setError(null);
      setMaxDaysAvailable(null);
      return;
    }
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    if (origin?.lat && origin?.lng) {
      generate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng]);

  const availableFoods = planData?.availableFoods || [];
  const maxDayInput = maxDaysAvailable && maxDaysAvailable > 0 ? maxDaysAvailable : 14;

  useEffect(() => {
    if (maxDaysAvailable && maxDaysAvailable > 0 && days > maxDaysAvailable) {
      setDays(maxDaysAvailable);
    }
  }, [maxDaysAvailable, days]);

  function requestLocationAccess() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported on this device.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(err?.message || 'Unable to fetch your location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  return (
    <div className="itinerary-page" style={{ padding: '20px', fontFamily: 'Poppins, sans-serif', color: '#0f172a', minHeight: 'calc(100vh - 120px)', background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)' }}>
      {/* Header */}
      <div className="itinerary-header mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <div className="header-icon-wrapper bg-primary bg-opacity-10 rounded-3 p-3">
            <i className="bi bi-calendar-check text-primary" style={{ fontSize: '2rem' }}></i>
          </div>
          <div>
            <h1 className="fw-bold mb-1" style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Powered Itinerary
            </h1>
            <p className="text-muted mb-0">Personalized plan including travel buffers, rest, meal recommendations and lodging tips</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-card card border-0 shadow-lg mb-4" style={{
        borderRadius: '16px',
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
      }}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-2">
              <i className="bi bi-calendar3 me-1"></i>
              Days
            </label>
            <input
              type="number"
              min={1}
              max={maxDayInput}
              value={days}
              onChange={(e) => {
                const next = Number(e.target.value || 1);
                setDays(next);
                if (error && maxDaysAvailable && maxDaysAvailable > 0 && next <= maxDaysAvailable) {
                  setError(null);
                }
              }}
              className="form-control"
              style={{ borderRadius: '10px' }}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-2">
              <i className="bi bi-wallet2 me-1"></i>
              Budget
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="form-select"
              style={{ borderRadius: '10px' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-2">
              <i className="bi bi-heart me-1"></i>
              Interest
            </label>
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="form-select"
              style={{ borderRadius: '10px' }}
            >
              <option value="all">All Interests</option>
              <option value="culture">Culture</option>
              <option value="nature">Nature</option>
              <option value="adventure">Adventure</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <button
              onClick={generate}
              disabled={loading || !selected}
              className="btn btn-primary w-100 rounded-pill"
              style={{
                fontWeight: '600',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Generating…
                </>
              ) : (
                <>
                  <i className="bi bi-magic me-2"></i>
                  Generate Plan
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 small text-muted">
          {typeof maxDaysAvailable === 'number'
            ? maxDaysAvailable > 0
              ? `Up to ${maxDaysAvailable} curated day${maxDaysAvailable > 1 ? 's' : ''} available based on current experiences.`
              : 'We are curating experiences for this destination — check back soon for more options.'
            : 'Set your preferences and we will craft the best possible experience.'}
        </div>

        <div className="mt-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button
              type="button"
              onClick={requestLocationAccess}
              disabled={locating}
              className="btn btn-outline-primary btn-sm rounded-pill"
              style={{ minWidth: '150px' }}
            >
              {locating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Locating…
                </>
              ) : (
                <>
                  <i className="bi bi-geo-alt me-1"></i>
                  Use My Location
                </>
              )}
            </button>
            {origin?.lat && origin?.lng ? (
              <span className="small text-success fw-semibold">
                Using your location (~{origin.lat.toFixed(2)}, {origin.lng.toFixed(2)})
                {origin.accuracy ? ` · ±${origin.accuracy}m` : ''}
              </span>
            ) : (
              <span className="small text-muted">
                Using state center as starting point for travel estimates.
              </span>
            )}
          </div>
          {locationError ? (
            <span className="small text-danger">{locationError}</span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="alert alert-warning border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Heads up:</strong> {error}
        </div>
      ) : null}

      {!planData && !error ? (
        <div className="empty-state text-center py-5">
          <i className="bi bi-calendar-x text-muted" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          <p className="text-muted mt-3 mb-0 fw-semibold">
            {loading ? 'Building tailored itinerary…' : 'Select a state to view a curated itinerary.'}
          </p>
        </div>
      ) : planData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {planData.summary ? (
            <section className="trip-overview card border-0 shadow-lg" style={{ borderRadius: '16px', padding: '24px' }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-graph-up-arrow text-primary" style={{ fontSize: '1.5rem' }}></i>
                <h2 className="fw-bold mb-0" style={{ fontSize: '20px' }}>Trip Overview</h2>
              </div>
              <div className="d-flex flex-wrap gap-3">
                <DayStat
                  label="Travel Time"
                  value={planData.summary.totalTravel}
                  caption={`Distance: ${formatDistance(planData.summary.totalDistanceKm)}`}
                />
                <DayStat
                  label="Activities"
                  value={planData.summary.totalActivities}
                  caption={`Avg distance/day: ${formatDistance(planData.summary.avgDistancePerDay)}`}
                />
                <DayStat
                  label="Meal Time"
                  value={planData.summary.totalMealTime}
                />
                <DayStat
                  label="Rest & Sleep"
                  value={`${planData.summary.totalRest} + ${planData.summary.totalSleep}`}
                />
                <DayStat
                  label="Awake Hours"
                  value={planData.summary.awakeTimeFormatted}
                />
                {planData.budgetBreakdown ? (
                  <DayStat
                    label="Estimated Budget"
                    value={planData.budgetBreakdown.estimatedTripBudget}
                    caption={`Stay/night: ${planData.budgetBreakdown.accommodationPerNight}`}
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {availableFoods.length ? (
            <section className="local-foods card border-0 shadow-sm" style={{ borderRadius: '16px', padding: '20px' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-egg-fried text-warning" style={{ fontSize: '1.5rem' }}></i>
                <h2 className="fw-bold mb-0" style={{ fontSize: '18px' }}>Local Favourites</h2>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {availableFoods.map((meal, idx) => (
                  <span key={`${meal.name}-${idx}`} className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25" style={{
                    borderRadius: '20px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    <i className="bi bi-egg-fried me-1"></i>
                    {meal.name}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {planData.plan?.map((day) => (
            <section key={day.day} className="day-section card border-0 shadow-lg" style={{
              borderRadius: '20px',
              padding: '24px',
              background: '#fff',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(15,23,42,0.06)'
            }}
            >
              <div className="d-flex flex-wrap gap-2 align-items-baseline mb-4">
                <div className="day-badge bg-primary bg-opacity-10 rounded-pill px-3 py-1">
                  <h3 className="fw-bold mb-0 text-primary" style={{ fontSize: '22px' }}>Day {day.day}</h3>
                </div>
                <span className="small text-muted">
                  <i className="bi bi-clock me-1"></i>
                  Awake time {day.awakeTimeFormatted} · Total scheduled {day.totalDayTimeFormatted}
                </span>
              </div>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <DayStat label="Travel" value={formatMinutes(day.summary.travelMinutes)} caption={formatDistance(day.summary.distanceKm)} />
                <DayStat label="Activities" value={formatMinutes(day.summary.activitiesMinutes)} />
                <DayStat label="Meals" value={formatMinutes(day.summary.mealsMinutes)} />
                <DayStat label="Rest" value={`${formatMinutes(day.summary.restMinutes)} + ${formatMinutes(day.summary.sleepMinutes)}`} />
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-utensils text-primary"></i>
                  <h4 className="fw-bold mb-0" style={{ fontSize: '18px' }}>Meal Plan</h4>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <MealCard title="Breakfast" meal={day.meals?.breakfast} />
                  </div>
                  <div className="col-12 col-md-4">
                    <MealCard title="Lunch" meal={day.meals?.lunch} />
                  </div>
                  <div className="col-12 col-md-4">
                    <MealCard title="Dinner" meal={day.meals?.dinner} />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-clock-history text-primary"></i>
                  <h4 className="fw-bold mb-0" style={{ fontSize: '18px' }}>Timeline</h4>
                </div>
                <div className="d-flex flex-column gap-2">
                  {day.timeline?.map((slot, idx) => (
                    <TimelineSlot key={`${slot.type}-${idx}-${slot.start}`} slot={slot} />
                  ))}
                </div>
              </div>

              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-geo-alt text-primary"></i>
                  <h4 className="fw-bold mb-0" style={{ fontSize: '18px' }}>Stops & Experiences</h4>
                </div>
                {day.sites.length ? (
                  <div className="row g-3">
                    {day.sites.map((site, index) => {
                      const travelLabel = site.travelDurationFormatted
                        ? `${site.travelDurationFormatted}${site.travelDistanceKmFromPrevious ? ` · ${formatDistance(site.travelDistanceKmFromPrevious)}` : ''}`
                        : index === 0 ? 'Start point' : '—';
                      return (
                        <div key={`${site.id}-${index}`} className="col-12 col-md-6 col-lg-4">
                          <div className="site-card card border-0 shadow-sm h-100" style={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)'
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                          >
                            <div style={{ width: '100%', height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {site.image && site.image.trim() ? (
                                <img
                                  src={site.image}
                                  alt={site.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div style={{ display: site.image && site.image.trim() ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
                                <div>
                                  <i className="bi bi-image" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                                  <div className="mt-2">Image coming soon</div>
                                </div>
                              </div>
                            </div>
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h5 className="fw-bold mb-1">{site.name}</h5>
                                  <span className="badge bg-primary bg-opacity-10 text-primary small">{site.category}</span>
                                </div>
                              </div>
                              <p className="small text-muted mb-2" style={{ lineHeight: '1.5', minHeight: '40px' }}>{site.description}</p>
                              <div className="small mb-2">
                                <i className="bi bi-clock me-1"></i>
                                <b>Visit:</b> {site.visitDurationFormatted || site.visitTime} · <b>From previous:</b> {travelLabel}
                              </div>
                              <div className="small text-muted mb-2">
                                <i className="bi bi-calendar-event me-1"></i>
                                <b>Schedule:</b> {site.arrivalTime} – {site.departureTime}
                              </div>
                              {site.famousFoods?.length ? (
                                <div className="mb-2">
                                  <span className="badge bg-warning bg-opacity-10 text-warning small">
                                    <i className="bi bi-egg-fried me-1"></i>
                                    Must try: {site.famousFoods.slice(0, 2).map((f) => f.name).join(', ')}
                                  </span>
                                </div>
                              ) : null}
                              {site.hotels?.length ? (
                                <div className="small mb-2">
                                  <i className="bi bi-building me-1"></i>
                                  <b>Stay nearby:</b> {site.hotels[0].name} · {site.hotels[0].type} · {formatMoney(site.hotels[0].priceINR)}
                                </div>
                              ) : null}
                              <div className="small text-muted">
                                <i className="bi bi-currency-rupee me-1"></i>
                                <b>Est. stay cost:</b> {formatMoney(site.estimatedStayCost)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-calendar-x" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                    <p className="mt-2 mb-0">Leisure day — explore markets, wellness experiences or optional add-ons.</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
