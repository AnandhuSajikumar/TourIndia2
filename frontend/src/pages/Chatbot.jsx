import { useRef, useState, useEffect } from 'react'
import { useTourismState } from '../state/StateContext.jsx'

export default function Chatbot() {
  const { selected } = useTourismState()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `👋 Namaste! Ask me about places, travel time, or local products in ${selected || 'India'}.` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scroller = useRef(null)

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [messages])

  useEffect(() => {
    if (selected) {
      setMessages([{ role: 'assistant', content: `👋 Namaste! Ask me about places, travel time, or local products in ${selected}.` }])
    }
  }, [selected])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].slice(-10) })
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || '...' }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '⚠️ Service unavailable right now. Please try again later.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const quick = [
    { text: 'Top destinations', icon: 'bi-star' },
    { text: 'Cultural places', icon: 'bi-building' },
    { text: 'Best time to visit', icon: 'bi-calendar' },
    { text: 'Local handicrafts', icon: 'bi-bag' },
    { text: 'Travel tips', icon: 'bi-lightbulb' },
    { text: 'Local cuisine', icon: 'bi-egg-fried' }
  ]

  return (
    <div className="chatbot-page" style={{
      fontFamily: 'Poppins, sans-serif',
      maxWidth: '900px',
      margin: '20px auto',
      minHeight: 'calc(100vh - 120px)'
    }}>
      {/* Header */}
      <div className="chatbot-header card border-0 shadow-lg mb-4" style={{ borderRadius: '16px', padding: '24px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
        <div className="d-flex align-items-center gap-3 mb-2">
          <div className="header-icon-wrapper bg-primary bg-opacity-10 rounded-3 p-3">
            <i className="bi bi-chat-dots text-primary" style={{ fontSize: '2rem' }}></i>
          </div>
          <div>
            <h1 className="fw-bold mb-1" style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Tourism Assistant
            </h1>
            <p className="text-muted mb-0">Get instant answers about destinations, travel tips, and local culture</p>
          </div>
        </div>
        {selected && (
          <div className="mt-3">
            <span className="badge bg-primary rounded-pill px-3 py-2">
              <i className="bi bi-geo-alt-fill me-1"></i>
              Currently exploring: {selected}
            </span>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="quick-suggestions card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', padding: '20px' }}>
        <div className="small fw-semibold text-muted mb-3">
          <i className="bi bi-lightning-charge me-1"></i>
          Quick Questions
        </div>
        <div className="d-flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q.text}
              onClick={() => setInput(q.text)}
              className="btn btn-outline-primary btn-sm rounded-pill"
              style={{
                transition: 'all 0.3s ease',
                border: '1px solid #dee2e6'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <i className={`bi ${q.icon} me-1`}></i>
              {q.text}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-container card border-0 shadow-lg mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div
          ref={scroller}
          className="chat-messages"
          style={{
            padding: '24px',
            height: '60vh',
            minHeight: '400px',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
            scrollBehavior: 'smooth'
          }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-left-dots text-muted" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
              <p className="text-muted mt-3 mb-0">Start a conversation to get travel insights</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`message-wrapper mb-3 ${m.role === 'user' ? 'text-end' : 'text-start'}`}
              >
                <div
                  className={`message-bubble d-inline-block ${
                    m.role === 'user' ? 'user-message' : 'assistant-message'
                  }`}
                  style={{
                    padding: '14px 18px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    maxWidth: '75%',
                    wordWrap: 'break-word',
                    backgroundColor: m.role === 'user' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : '#ffffff',
                    background: m.role === 'user' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : '#ffffff',
                    color: m.role === 'user' ? '#fff' : '#222',
                    border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="d-flex align-items-start gap-2">
                    {m.role === 'assistant' && (
                      <div className="assistant-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                        <i className="bi bi-robot text-primary"></i>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      {m.content}
                    </div>
                    {m.role === 'user' && (
                      <div className="user-avatar bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                        <i className="bi bi-person-fill text-white"></i>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="text-start mb-3">
              <div className="assistant-message d-inline-block" style={{
                padding: '14px 18px',
                borderRadius: '18px 18px 18px 4px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="assistant-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                    <i className="bi bi-robot text-primary"></i>
                  </div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="chat-input-wrapper p-3" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <form onSubmit={sendMessage} className="d-flex gap-2">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0" style={{ borderRadius: '20px 0 0 20px' }}>
                <i className="bi bi-chat-left-text text-muted"></i>
              </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${selected || 'India'} tourism...`}
                className="form-control border-start-0"
                style={{
                  borderRadius: '0 20px 20px 0',
                  fontSize: '14px',
                  border: '1px solid #dee2e6'
                }}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary rounded-pill px-4"
              style={{
                fontWeight: '600',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <>
                  <i className="bi bi-send-fill me-1"></i>
                  Send
                </>
              )}
            </button>
          </form>
          <p className="small text-muted text-center mt-3 mb-0">
            <i className="bi bi-info-circle me-1"></i>
            Note: Demo responses only — integrate OpenAI/Gemini API for live data.
          </p>
        </div>
      </div>

      <style>{`
        .chatbot-page {
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
        }
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 10px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
