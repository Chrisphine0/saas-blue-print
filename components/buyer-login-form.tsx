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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Unable to sign in. Please check your credentials.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!data || !data.user) {
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

      // Check if user has a buyer profile
      let buyer: any = null
      try {
        const res = await supabase
          .from("buyers")
          .select("*")
          .eq("user_id", userId)
          .single()
        buyer = res.data
        // If the client returns an error object, treat as missing buyer
        if (res.error) {
          buyer = null
        }
      } catch (err) {
        // Network or fetch-level error: show a user-friendly toast and stop flow
        toast({
          title: "Login Failed",
          description: "Unable to verify account type. If you're a supplier, please use the supplier login.",
          variant: "destructive",
        })
        try {
          await supabase.auth.signOut()
        } catch (_) {}
        setLoading(false)
        return
      }

      if (!buyer) {
        // Also check if account is a supplier and show clearer message
        try {
          const { data: supplier, error: supplierError } = await supabase
            .from("suppliers")
            .select("*")
            .eq("user_id", userId)
            .single()

          if (!supplierError && supplier) {
            toast({
              title: "Access Denied",
              description: "This account is registered as a supplier. Please use the supplier login page.",
              variant: "destructive",
            })
            try {
              await supabase.auth.signOut()
            } catch (_) {}
            setLoading(false)
            return
          }
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            // Keep developer logs in dev only
            // eslint-disable-next-line no-console
            console.error("Error checking supplier profile during buyer login:", err)
          }
        }

        toast({
          title: "Access Denied",
          description: "This account is not registered as a buyer.",
          variant: "destructive",
        })
        try {
          await supabase.auth.signOut()
        } catch (_) {}
        setLoading(false)
        return
      }

      toast({
        title: "Welcome back!",
        description: "Login successful.",
      })

      router.push("/buyer/dashboard")
      router.refresh()
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Login error (client):", error)
      }
      toast({
        title: "Login Failed",
        description: error?.message || "Unknown error",
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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>
    </form>
  )
}
