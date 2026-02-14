// Token operations
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}

// User operations
export const setUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

export const removeUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

// Auth check
export const checkAuth = () => {
  return new Promise((resolve) => {
    const token = getAuthToken()
    const user = getUser()
    
    if (token && user) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

// Logout
export const logout = () => {
  removeAuthToken()
  removeUser()
}

// Check if user is admin
export const isAdmin = () => {
  const user = getUser()
  return user?.isAdmin === true
}