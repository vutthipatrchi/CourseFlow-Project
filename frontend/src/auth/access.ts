export type UserRole = 'admin' | 'student' | 'guest'

const roleKey = 'courseflow.userRole'

export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return 'guest'

  const role = window.sessionStorage.getItem(roleKey)
  return role === 'admin' || role === 'student' ? role : 'guest'
}

export function setUserRole(role: Exclude<UserRole, 'guest'>) {
  window.sessionStorage.setItem(roleKey, role)
}

export function clearUserRole() {
  window.sessionStorage.removeItem(roleKey)
}

export function hasAdminAccess() {
  return getUserRole() === 'admin'
}
