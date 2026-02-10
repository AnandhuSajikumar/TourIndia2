import { io } from 'socket.io-client'

// Try to connect via same-origin (Vite dev proxy). If proxying fails (ECONNREFUSED),
// fall back to connecting directly to the backend on localhost:5000.
let socket = io('/', { autoConnect: false })

const tryDirect = () => {
	try {
		socket = io('http://localhost:5000', { autoConnect: false })
		socket.connect()
		return socket
	} catch (e) {
		console.warn('Direct socket connect failed', e)
		return socket
	}
}

// Start with proxied attempt
socket.connect()

socket.on('connect_error', (err) => {
	console.warn('Socket connect_error (proxy?)', err && err.message)
	// If proxy refused connection, try direct connection to backend
	if (err && (err.message.includes('ECONNREFUSED') || err.message.includes('connect'))) {
		tryDirect()
	}
})

export { socket }


