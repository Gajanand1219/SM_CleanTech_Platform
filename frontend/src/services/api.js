import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  // baseURL: import.meta.env.VITE_API_URL || 'https://sm-cleantech-platform.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sm_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default API