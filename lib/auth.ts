import { stackServerApp } from '../stack'

export async function requireUser() {
  try {
    const user = await stackServerApp.getUser()
    if (!user) throw new Error('Unauthorized')
    return user
  } catch (e) {
    throw new Error('Unauthorized')
  }
}

export async function getCurrentUser() {
  try {
    return await stackServerApp.getUser()
  } catch {
    return null
  }
}