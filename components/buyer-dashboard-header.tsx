"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Package,
  CreditCard,
  Truck,
  MessageSquare,
  Star,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react"
import type { Buyer, Notification } from "@/lib/types"

interface BuyerDashboardHeaderProps {
  buyer: Buyer | null
}

const typeIcons = {
  order: Package,
  payment: CreditCard,
  delivery: Truck,
  message: MessageSquare,
  review: Star,
  system: Bell,
  inventory: AlertTriangle,
}

export function BuyerDashboardHeader({ buyer }: BuyerDashboardHeaderProps) {
  const router = useRouter()
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isPopping, setIsPopping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const buyerId = buyer?.id
  const buyerUserId = buyer?.user_id

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/buyer/auth/login")
    router.refresh()
  }

  // Inside BuyerDashboardHeader component
  useEffect(() => {
    if (!buyerId) return
    const supabase = createClient()

    async function fetchCartCount() {
      const { count, error } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", buyerId)

      if (!error) {
        setCartItemCount(count || 0)
        // Trigger pop animation when count changes
        setIsPopping(true)
        setTimeout(() => setIsPopping(false), 300)
      }
    }
    async function fetchNotifications() {
      setLoadingNotifications(true)
      const userIds = [buyerId, buyerUserId].filter(Boolean)

      const unreadRes = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "buyer")
        .in("user_id", userIds as string[])
        .eq("is_read", false)

      setUnreadCount((unreadRes as any)?.count || 0)

      const listRes = await supabase
        .from("notifications")
        .select("*")
        .eq("user_type", "buyer")
        .in("user_id", userIds as string[])
        .order("created_at", { ascending: false })
        .limit(6)

      setNotifications(listRes.data || [])
      setLoadingNotifications(false)
    }

    // Initial Fetch
    fetchCartCount()
    fetchNotifications()

    // This listens to actual changes in the database (Add to cart, Delete from cart)
  const cartChannel = supabase
    .channel('cart-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for INSERT, UPDATE, and DELETE
        schema: 'public',
        table: 'cart_items',
        filter: `buyer_id=eq.${buyerId}`,
      },
      () => {
        fetchCartCount() // Refresh count whenever database changes
      }
    )
    .subscribe()

    // ⚡ LISTEN FOR LIVE UPDATES
    const handleLiveUpdate = () => {
      fetchCartCount() // Update count immediately when event is heard
    }

    window.addEventListener("cart-updated", handleLiveUpdate)

    // Keep interval for notifications only
    const t = setInterval(fetchNotifications, 3000)

    return () => {
      supabase.removeChannel(cartChannel) // Clean up realtime
    window.removeEventListener("cart-updated", handleLiveUpdate)
    clearInterval(t)
    }
  }, [buyerId, buyerUserId])

  return (
    <header className="sticky top-0 z-20 border-b bg-background">
      <div className="flex h-14 lg:h-16 items-center gap-2 px-3 lg:px-6">
        {/* Left: Brand */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary lg:hidden">
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
          </div>

          <h2 className="text-sm lg:text-lg font-semibold truncate">
            {buyer?.business_name || "Buyer Dashboard"}
          </h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 lg:gap-3 flex-shrink-0">
          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={() => router.push("/buyer/dashboard/cart")}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground transition-all ${isPopping ? "animate-badge-pop shadow-lg" : ""
                  }`}
              >
                {cartItemCount}
              </span>
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-red-600 px-1.5 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-[calc(100vw-1rem)] sm:w-96 max-h-[65vh] overflow-y-auto"
            >
              <DropdownMenuLabel className="flex justify-between">
                <span>Notifications</span>
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {loadingNotifications ? (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type as keyof typeof typeIcons] || Bell
                  return (
                    <Card
                      key={n.id}
                      className="mx-2 mb-2 cursor-pointer"
                      onClick={() => router.push(n.action_url || "#")}
                    >
                      <CardContent className="p-3 flex gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <Badge className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  router.push("/buyer/dashboard/notifications")
                }
                className="justify-center"
              >
                View all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {buyer?.business_name?.[0] || "B"}
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium truncate">
                  {buyer?.business_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {buyer?.email}
                </p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() =>
                  router.push("/buyer/dashboard/settings/profile")
                }
              >
                Profile Settings
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  router.push("/buyer/dashboard/settings/business")
                }
              >
                Business Details
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
