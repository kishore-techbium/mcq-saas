const adminEmails =
  process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || []

export function isAdmin(user) {
  if (!user || !user.email) return false
  return adminEmails.includes(user.email)
}
