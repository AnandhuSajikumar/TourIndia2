import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      // Signup always creates a normal user. Admins must be created via a protected flow.
      const body = { email, password, name, role: 'user' }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      // navigate to login
      navigate('/login')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-3">Sign up</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border rounded px-2 py-1 w-full" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" className="border rounded px-2 py-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="border rounded px-2 py-1 w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {/* role selection removed: signup creates normal users only */}
        <div>
          <button className="bg-black text-white px-3 py-2 rounded">Create account</button>
        </div>
      </form>
    </div>
  )
}
