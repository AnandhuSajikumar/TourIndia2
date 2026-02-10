import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  // no app-level auth context — we persist to localStorage and reload

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
    // store token and user then reload so App reads the new user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user || {}))
    window.location.href = '/'
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-3">Login</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" className="border rounded px-2 py-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="border rounded px-2 py-1 w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <button className="bg-black text-white px-3 py-2 rounded">Login</button>
        </div>
      </form>
    </div>
  )
}
