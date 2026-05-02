import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const apiClient = axios.create({
  baseURL: 'https://localhost:5001/game',
})

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    // Handle request errors
    console.error('Request Error:', error)
    return Promise.reject(error)
  },
)

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Handle successful response
    return response
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      const { status, data } = error.response

      console.error(`API Error [${status}]:`, data)
    } else if (error.request) {
      console.error('No Response Received:', error.request)
    } else {
      console.error('Error:', error.message)
    }

    return Promise.reject(error)
  },
)

export default apiClient
