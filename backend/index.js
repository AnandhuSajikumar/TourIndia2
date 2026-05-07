import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { Server as SocketIOServer } from 'socket.io'

import authRouter from './routes/auth.js'
import aiRouter from './routes/ai.js'
import apiRouter from './routes/api.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../frontend/dist')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', time: new Date().toISOString() })
})

// (Removed human-friendly /health page per user request)

// Routers
app.use('/api/auth', authRouter)
app.use('/api/chat', aiRouter)
app.use('/api', apiRouter)

// Serve the built frontend when deployed as a single full-stack service.
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

const DEFAULT_PORT = Number(process.env.PORT || 5000)
const server = http.createServer(app)
const io = new SocketIOServer(server, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  socket.emit('welcome', { message: 'Connected to realtime updates' })
})

// Bind to the configured port only (user requested fixed port behavior)
server.listen(DEFAULT_PORT, () => {
  console.log(`API listening on http://localhost:${DEFAULT_PORT}`)
})

server.on('error', (err) => {
  if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES')) {
    console.error(`Port ${DEFAULT_PORT} unavailable (${err.code}). Please free the port or set PORT env var.`)
    process.exit(1)
  }
  console.error('Server error:', err)
  process.exit(1)
})


