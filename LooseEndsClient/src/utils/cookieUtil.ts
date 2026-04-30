export const cookieUtil = {
  setCookie(name: string, value: string, ageInSeconds: number) {
    document.cookie = `${name}=${value}; max-age=${ageInSeconds}; path=/`
  },

  getCookie(name: string) {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c: string | undefined = ca[i]

      if (!c) continue

      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length)
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length)
      }
    }
    return null
  },
}
