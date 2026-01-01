"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Normalize and set error messages from unknown values
  const setErrorMessage = (err: unknown) => {
    const message =
      err instanceof Error ? err.message : typeof err === "string" && err ? err : "An error occurred"
    setError(message)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Prevent buyer accounts from logging in on supplier login page
      try {
        const { data: buyerProfile, error: buyerError } = await supabase
          .from("buyers")
          .select("user_id")
          .eq("user_id", data.user.id)
          .single()

        if (!buyerError && buyerProfile) {
          // Signed in user has a buyer profile — block supplier login
          await supabase.auth.signOut()
          setError("This account is registered as a buyer. Please use the buyer login page.")
          setIsLoading(false)
          return
        }
      } catch (err) {
        // If the check fails, allow login to proceed but only log in development
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("Error checking buyer profile during supplier login:", err)
        }
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setErrorMessage(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold">B2B Ordering Platform</h1>
            <p className="text-sm text-muted-foreground">Manage your wholesale business</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl items-center text-center">Login</CardTitle>
              <CardDescription>Enter your credentials to access your supplier dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="supplier@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-[#072235] dark:border-[#0b4066] dark:text-[#d9f1ff]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/90 border border-slate-200 text-slate-900 placeholder:text-slate-400 dark:bg-[#072235] dark:border-[#0b4066] dark:text-[#d9f1ff]"
                    />
                  </div>
                  {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="underline underline-offset-4 hover:text-primary">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
