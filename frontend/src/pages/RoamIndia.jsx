import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTourismState } from "../state/StateContext.jsx";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const STATE_REGIONS = {
  "North": ["Jammu and Kashmir", "Ladakh", "Himachal Pradesh", "Punjab", "Haryana", "Delhi", "Uttarakhand", "Uttar Pradesh"],
  "South": ["Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Puducherry", "Lakshadweep"],
  "East": ["West Bengal", "Odisha", "Jharkhand", "Bihar", "Sikkim", "Assam", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura", "Meghalaya"],
  "West": ["Rajasthan", "Gujarat", "Maharashtra", "Goa", "Dadra and Nagar Haveli and Daman and Diu"],
  "Central": ["Madhya Pradesh", "Chhattisgarh"],
  "Union Territories": ["Andaman and Nicobar Islands", "Chandigarh", "Delhi", "Dadra and Nagar Haveli and Daman and Diu", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"]
};

export default function RoamIndia() {
  const navigate = useNavigate();
  const { setSelected, selected } = useTourismState();
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredState, setHoveredState] = useState(null);

  const handleStateClick = (name) => {
    setSelected(name);
    navigate("/map");
  };

  const filteredStates = STATES.filter(state => {
    const matchesSearch = state.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedRegion === "All") return matchesSearch;
    return matchesSearch && STATE_REGIONS[selectedRegion]?.includes(state);
  });

  const regions = ["All", ...Object.keys(STATE_REGIONS)];

  return (
    <div className="roam-india-page" style={{ minHeight: 'calc(100vh - 120px)', position: 'relative' }}>
      {/* Hero Header */}
      <div className="roam-hero text-center py-4 mb-4 position-relative overflow-hidden">
        <div className="hero-overlay position-absolute top-0 start-0 w-100 h-100"></div>
        <div className="container position-relative">
          <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
            <div className="hero-icon-wrapper">
              <i className="bi bi-compass-fill"></i>
            </div>
            <h1 className="display-4 fw-bold text-white mb-0">
              ROAM INDIA
            </h1>
          </div>
          <p className="lead text-white-50 mb-0" style={{ maxWidth: '700px', margin: '0 auto' }}>
            Explore all 28 states and 8 union territories. Click on any state to discover its hidden gems, 
            cultural heritage, and breathtaking destinations.
          </p>
        </div>
      </div>

      <div className="container-fluid px-4">
        {/* Horizontal Filter Bar */}
        <div className="filter-bar card border-0 shadow-lg mb-4" style={{ borderRadius: '16px', padding: '20px' }}>
          <div className="row g-3 align-items-end">
            {/* Region Filter */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-semibold text-muted mb-2">
                <i className="bi bi-globe me-1"></i>
                FILTER BY REGION
              </label>
              <select 
                className="form-select form-select-sm"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                style={{ borderRadius: '10px', border: '1px solid #dee2e6' }}
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-muted mb-2">
                <i className="bi bi-search me-1"></i>
                SEARCH STATE
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '10px 0 0 10px' }}>
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Type state name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderRadius: '0 10px 10px 0' }}
                />
              </div>
            </div>

            {/* State Count */}
            <div className="col-12 col-md-2">
              <div className="state-count-badge bg-primary bg-opacity-10 rounded-3 p-3 text-center">
                <div className="fw-bold text-primary mb-1" style={{ fontSize: '1.5rem' }}>
                  {filteredStates.length}
                </div>
                <div className="small text-muted">
                  {filteredStates.length === 1 ? 'State' : 'States'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12 col-md-3">
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm flex-fill"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRegion('All');
                  }}
                  style={{ borderRadius: '10px' }}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Reset
                </button>
                <button 
                  className="btn btn-primary btn-sm flex-fill"
                  onClick={() => navigate('/map')}
                  style={{ borderRadius: '10px' }}
                  disabled={!selected}
                >
                  <i className="bi bi-map me-1"></i>
                  View Map
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* States Grid */}
        <div className="states-grid-container card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', padding: '20px' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="fw-bold mb-0 d-flex align-items-center">
              <i className="bi bi-list-ul me-2 text-primary"></i>
              Select a State to Explore
            </h5>
            {selected && (
              <span className="badge bg-primary rounded-pill">
                <i className="bi bi-check-circle me-1"></i>
                {selected}
              </span>
            )}
          </div>
          <div className="states-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '12px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '10px'
          }}>
            {filteredStates.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                <p className="text-muted mt-3 mb-0">No states found matching your criteria</p>
              </div>
            ) : (
              filteredStates.map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateClick(state)}
                  onMouseEnter={(e) => {
                    setHoveredState(state)
                    if (selected !== state) {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    setHoveredState(null)
                    if (selected !== state) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                  className={`state-card-btn btn ${
                    selected === state ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  style={{
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    border: selected === state ? 'none' : '1px solid #dee2e6',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="flex-grow-1">
                      <div className="fw-semibold mb-1" style={{ fontSize: '14px' }}>{state}</div>
                      <div className="small opacity-75">
                        {STATE_REGIONS[Object.keys(STATE_REGIONS).find(r => STATE_REGIONS[r].includes(state))] ? 
                          Object.keys(STATE_REGIONS).find(r => STATE_REGIONS[r].includes(state)) : 
                          'Union Territory'}
                      </div>
                    </div>
                    <i className={`bi bi-arrow-right ${hoveredState === state ? 'ms-2' : ''}`} 
                       style={{ 
                         transition: 'all 0.3s ease',
                         opacity: hoveredState === state ? 1 : 0.5,
                         fontSize: '1.2rem'
                       }}></i>
                  </div>
                  {selected === state && (
                    <div className="position-absolute top-0 end-0 m-2">
                      <i className="bi bi-check-circle-fill text-white"></i>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Map Area */}
        <div className="roam-map-container card border-0 shadow-lg position-relative overflow-hidden" 
             style={{ 
               height: 'calc(100vh - 550px)',
               minHeight: '500px',
               borderRadius: '16px'
             }}>
          {/* Map Background */}
          <div className="map-background position-absolute top-0 start-0 w-100 h-100">
            <img
              src="map.jpeg"
              alt="India Map"
              className="w-100 h-100"
              style={{
                objectFit: 'cover',
                filter: 'brightness(0.85) contrast(1.1) saturate(1.2)',
                transition: 'filter 0.3s ease'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            <div className="position-absolute top-0 start-0 w-100 h-100 d-none align-items-center justify-content-center" 
                 style={{ 
                   background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                   color: 'white'
                 }}>
              <div className="text-center">
                <i className="bi bi-map" style={{ fontSize: '4rem', opacity: 0.5 }}></i>
                <p className="mt-3">India Map</p>
              </div>
            </div>
          </div>

          {/* Gradient Overlay */}
          <div className="position-absolute bottom-0 start-0 w-100" 
               style={{
                 height: '40%',
                 background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
               }}></div>

          {/* Info Overlay */}
          <div className="position-absolute top-0 start-0 w-100 p-4">
            <div className="info-card d-inline-block bg-white bg-opacity-95 backdrop-blur rounded-pill px-4 py-2 shadow-lg">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-primary"></i>
                <span className="fw-semibold small">
                  {selected ? `Exploring: ${selected}` : 'Select a state from above to explore'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="position-absolute bottom-4 start-50 translate-middle-x w-100 px-4">
            <div className="row g-3 justify-content-center">
              <div className="col-auto">
                <div className="stat-card bg-white bg-opacity-95 backdrop-blur rounded-3 px-4 py-3 shadow-lg text-center">
                  <div className="fw-bold text-primary mb-1" style={{ fontSize: '1.5rem' }}>36</div>
                  <div className="small text-muted">States & UTs</div>
                </div>
              </div>
              <div className="col-auto">
                <div className="stat-card bg-white bg-opacity-95 backdrop-blur rounded-3 px-4 py-3 shadow-lg text-center">
                  <div className="fw-bold text-success mb-1" style={{ fontSize: '1.5rem' }}>1000+</div>
                  <div className="small text-muted">Destinations</div>
                </div>
              </div>
              <div className="col-auto">
                <div className="stat-card bg-white bg-opacity-95 backdrop-blur rounded-3 px-4 py-3 shadow-lg text-center">
                  <div className="fw-bold text-warning mb-1" style={{ fontSize: '1.5rem' }}>500+</div>
                  <div className="small text-muted">Products</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hovered State Highlight */}
          {hoveredState && (
            <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
              <div className="state-highlight bg-primary bg-opacity-90 text-white rounded-pill px-4 py-2 shadow-lg animate-fade-in">
                <i className="bi bi-geo-alt-fill me-2"></i>
                {hoveredState}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .roam-india-page {
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
        }
        .roam-hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 0 0 30px 30px;
          margin: -20px -20px 30px -20px;
        }
        .hero-overlay {
          background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.3;
        }
        .hero-icon-wrapper {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
        }
        .filter-bar {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        }
        .state-count-badge {
          border: 2px solid rgba(102, 126, 234, 0.2);
        }
        .states-grid::-webkit-scrollbar {
          width: 6px;
        }
        .states-grid::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 10px;
        }
        .states-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .state-card-btn {
          min-height: 80px;
        }
        .roam-map-container {
          border-radius: 16px !important;
        }
        .stat-card {
          min-width: 120px;
          transition: transform 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-5px);
        }
        .backdrop-blur {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 992px) {
          .roam-map-container {
            height: 400px !important;
            min-height: 400px !important;
          }
          .states-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
            max-height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
}
