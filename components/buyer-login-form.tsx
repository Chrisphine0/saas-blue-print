"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createBrowserClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || "Unable to sign in. Please check your credentials.")
        toast({
          title: "Login Failed",
          description: authError.message || "Unable to sign in. Please check your credentials.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!data || !data.user) {
        setError("No user data returned. Please try again.")
        toast({
          title: "Login Failed",
          description: "No user data returned. Please try again.",
          variant: "destructive",
        })
        try {
          await supabase.auth.signOut()
        } catch (_) {}
        setLoading(false)
        return
      }

      const userId = data.user.id

      // Check if user has a buyer profile using maybeSingle() to avoid 406 errors
      const { data: buyerData, error: buyerError } = await supabase
        .from("buyers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      // Only treat as error if it's not a "not found" scenario (PGRST116)
      if (buyerError && buyerError.code !== 'PGRST116') {
        console.error("Error checking buyer profile:", buyerError)
        setError("Unable to verify account type. Please try again.")
        toast({
          title: "Login Failed",
          description: "Unable to verify account type. Please try again.",
          variant: "destructive",
        })
        try {
          await supabase.auth.signOut()
        } catch (_) {}
        setLoading(false)
        return
      }

      if (!buyerData) {
        // Check if account is a supplier and block login
        const { data: supplierData, error: supplierError } = await supabase
          .from("suppliers")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle()

        // If supplier check also fails with real error (not just not found)
        if (supplierError && supplierError.code !== 'PGRST116') {
          console.error("Error checking supplier profile:", supplierError)
          setError("Unable to verify account type. Please try again.")
          toast({
            title: "Login Failed",
            description: "Unable to verify account type. Please try again.",
            variant: "destructive",
          })
          try {
            await supabase.auth.signOut()
          } catch (_) {}
          setLoading(false)
          return
        }

        if (supplierData) {
          // Block supplier accounts from logging in on buyer login page
          await supabase.auth.signOut()
          const errorMsg = "This account is registered as a supplier. Please use the supplier login page."
          setError(errorMsg)
          toast({
            title: "Wrong Login Page",
            description: errorMsg,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        // Not a buyer or supplier
        const errorMsg = "This email is not registered as a buyer. Please sign up first or check if you're using the correct login page."
        setError(errorMsg)
        toast({
          title: "Account Not Found",
          description: errorMsg,
          variant: "destructive",
        })
        try {
          await supabase.auth.signOut()
        } catch (_) {}
        setLoading(false)
        return
      }

      // Successful buyer login
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${buyerData.business_name || 'buyer'}.`,
      })

      router.push("/buyer/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMsg = error?.message || "An unexpected error occurred. Please try again."
      setError(errorMsg)
      toast({
        title: "Login Failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>
    </form>
  )
}