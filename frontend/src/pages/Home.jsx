import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: 'bi-robot',
      title: 'AI Itinerary',
      description: 'Personalized travel plans based on your interests, budget, and time.',
      link: '/itinerary',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      delay: '0.1s'
    },
    {
      icon: 'bi-map',
      title: 'Interactive Map',
      description: 'Explore famous destinations with real-time travel insights and smart filters.',
      link: '/map',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      delay: '0.2s'
    },
    {
      icon: 'bi-shop',
      title: 'Marketplace',
      description: 'Shop authentic handicrafts and book local homestays to support communities.',
      link: '/market',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      delay: '0.3s'
    },
    {
      icon: 'bi-chat-dots',
      title: 'AI Chatbot',
      description: 'Get instant answers about destinations, travel tips, and local culture.',
      link: '/chat',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      delay: '0.4s'
    },
    {
      icon: 'bi-graph-up-arrow',
      title: 'Analytics',
      description: 'View tourism insights, visitor trends, and popular destinations.',
      link: '/admin',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      delay: '0.5s'
    },
    {
      icon: 'bi-globe',
      title: 'Roam India',
      description: 'Explore all 28 states and 8 union territories on an interactive map.',
      link: '/roam',
      color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      delay: '0.6s'
    }
  ]

  return (
    <div className="home-page" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero Section */}
      <section className="hero-section text-center py-5 mb-5">
        <div className={`hero-content ${isVisible ? 'fade-in-up' : ''}`} style={{ animationDelay: '0s' }}>
          <div className="hero-badge mb-3">
            <span className="badge bg-primary bg-opacity-10 text-primary px-4 py-2 rounded-pill">
              <i className="bi bi-star-fill me-2"></i>
              Discover Incredible India
            </span>
          </div>
          <h1 className="display-3 fw-bold mb-4 hero-title">
            <span className="gradient-text">ROAM INDIA</span>
            <br />
            <span className="fs-2 text-muted">Your Gateway to Bharat</span>
          </h1>
          <p className="lead mb-4 hero-description" style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.15rem', lineHeight: '1.8' }}>
            Experience India's rich cultural heritage, breathtaking landscapes, and vibrant traditions. 
            Plan your perfect journey with AI-powered tools, explore interactive maps, and connect with local communities.
          </p>
          <div className="hero-actions d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/roam" className="btn btn-lg btn-primary px-5 py-3 rounded-pill shadow-lg hover-lift">
              <i className="bi bi-compass me-2"></i>
              Start Exploring
            </Link>
            <Link to="/itinerary" className="btn btn-lg btn-outline-primary px-5 py-3 rounded-pill shadow-sm hover-lift">
              <i className="bi bi-calendar-check me-2"></i>
              Plan Your Trip
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section py-4">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Explore Our Features</h2>
            <p className="text-muted">Everything you need for an unforgettable Indian adventure</p>
          </div>
          <div className="row g-4">
            {features.map((feature, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4">
                <Link to={feature.link} className="text-decoration-none">
                  <div 
                    className="feature-card card h-100 border-0 shadow-sm position-relative overflow-hidden"
                    style={{ 
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      animationDelay: feature.delay
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)'
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div 
                      className="feature-icon-wrapper position-absolute top-0 start-0 w-100"
                      style={{
                        height: '4px',
                        background: feature.color
                      }}
                    />
                    <div className="card-body p-4">
                      <div 
                        className="feature-icon mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: '70px',
                          height: '70px',
                          background: feature.color,
                          color: 'white',
                          fontSize: '2rem'
                        }}
                      >
                        <i className={`bi ${feature.icon}`}></i>
                      </div>
                      <h5 className="fw-bold mb-3 text-dark">{feature.title}</h5>
                      <p className="text-muted mb-0 small" style={{ lineHeight: '1.6' }}>
                        {feature.description}
                      </p>
                      <div className="mt-3 text-primary small fw-semibold">
                        Explore <i className="bi bi-arrow-right ms-1"></i>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5 mt-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px' }}>
        <div className="container text-center text-white">
          <div className="row g-4">
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <h2 className="fw-bold mb-1">36</h2>
                <p className="mb-0 small opacity-90">States & UTs</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <h2 className="fw-bold mb-1">1000+</h2>
                <p className="mb-0 small opacity-90">Destinations</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <h2 className="fw-bold mb-1">500+</h2>
                <p className="mb-0 small opacity-90">Local Products</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-item">
                <h2 className="fw-bold mb-1">24/7</h2>
                <p className="mb-0 small opacity-90">AI Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .home-page {
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 50%, #f0f4f8 100%);
        }
        .hero-section {
          position: relative;
          padding-top: 3rem;
        }
        .hero-content {
          opacity: 0;
          transform: translateY(20px);
        }
        .hero-content.fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-title {
          line-height: 1.2;
        }
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-3px);
        }
        .feature-card {
          border-radius: 16px !important;
          cursor: pointer;
        }
        .feature-icon-wrapper {
          border-radius: 16px 16px 0 0;
        }
        .stats-section {
          margin: 2rem auto;
          max-width: 1200px;
        }
        .stat-item h2 {
          font-size: 2.5rem;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem !important;
          }
          .display-3 {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  )
}
