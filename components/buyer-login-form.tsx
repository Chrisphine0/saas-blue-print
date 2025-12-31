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
        console.error("Supabase signInWithPassword error:", error)
        throw error
      }

      // Check if user has a buyer profile
        // Check if user has a buyer profile
        const { data: buyer, error: buyerError } = await supabase.from("buyers").select("*").eq("user_id", data.user.id).single()

        if (buyerError || !buyer) {
          // Also check if account is a supplier and show clearer message
          try {
            const { data: supplier, error: supplierError } = await supabase
              .from("suppliers")
              .select("*")
              .eq("user_id", data.user.id)
              .single()

            if (!supplierError && supplier) {
              toast({
                title: "Access Denied",
                description: "This account is registered as a supplier. Please use the supplier login page.",
                variant: "destructive",
              })
              await supabase.auth.signOut()
              return
            }
          } catch (err) {
            console.error("Error checking supplier profile during buyer login:", err)
          }

          toast({
            title: "Access Denied",
            description: "This account is not registered as a buyer.",
            variant: "destructive",
          })
          await supabase.auth.signOut()
          return
        }

      toast({
        title: "Welcome back!",
        description: "Login successful.",
      })

      router.push("/buyer/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error("Login error (client):", error)
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
