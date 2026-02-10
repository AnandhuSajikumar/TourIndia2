import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

export async function fetchHealth() {
  const { data } = await api.get('/health')
  return data
}


