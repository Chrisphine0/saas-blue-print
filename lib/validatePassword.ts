// lib/validatePassword.ts
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: "Password cannot be empty." }
  if (password.length < 6) return { valid: false, error: "Password must be at least 6 characters." }
  if (!/[a-z]/.test(password)) return { valid: false, error: "Password must contain a lowercase letter." }
  if (!/[A-Z]/.test(password)) return { valid: false, error: "Password must contain an uppercase letter." }
  if (!/[0-9]/.test(password)) return { valid: false, error: "Password must contain a number." }
  if (!/[^a-zA-Z0-9]/.test(password)) return { valid: false, error: "Password must contain a special character." }
  return { valid: true }
}