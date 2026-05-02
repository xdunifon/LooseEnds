import { ref } from 'vue'
import { defineStore } from 'pinia'
import { cookieUtil } from '@/utils/cookieUtil'

export const useAuthStore = defineStore('auth', () => {
  const tokenCookie = cookieUtil.getCookie('session')
  const token = ref<string | null>(tokenCookie)

  const setToken = (newToken: string) => {
    token.value = newToken
    document.cookie = `session=${newToken}; max-age=${60 * 60}; path=/` // One hour in seconds
  }

  const clearToken = () => {
    token.value = null
    document.cookie = `session=; max-age=-9999999;`
  }

  return {
    token,
    setToken,
    clearToken,
  }
})
