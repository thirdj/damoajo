import { stackServerApp } from '../stack'

export async function getCurrentUser() {
  const user = await stackServerApp.getUser()
  return user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
