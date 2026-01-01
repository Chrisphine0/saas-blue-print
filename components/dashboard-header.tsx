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
import { Bell, Package, CreditCard, Truck, MessageSquare, Star, AlertTriangle } from "lucide-react"
import type { Supplier, Notification } from "@/lib/types"

interface DashboardHeaderProps {
  supplier: Supplier | null
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

export function DashboardHeader({ supplier }: DashboardHeaderProps) {
  const router = useRouter()
  const [unreadOrders, setUnreadOrders] = useState<number>(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  useEffect(() => {
    if (!supplier) return
    const supabase = createClient()

    async function fetchUnreadAndList() {
      setLoadingNotifications(true)
      const userIds = [supplier.id, supplier.user_id].filter(Boolean)
      const unreadRes = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "supplier")
        .in("user_id", userIds as string[])
        .eq("type", "order")
        .eq("is_read", false)

      setUnreadOrders((unreadRes as any).count || 0)

      const listRes = await supabase
        .from("notifications")
        .select("*")
        .eq("user_type", "supplier")
        .in("user_id", userIds as string[])
        .order("created_at", { ascending: false })
        .limit(6)

      setNotifications((listRes.data as Notification[]) || [])
      setLoadingNotifications(false)
    }

    fetchUnreadAndList()
    const t = setInterval(fetchUnreadAndList, 30000)
    return () => clearInterval(t)
  }, [supplier])

  async function markAsRead(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadOrders((c) => Math.max(0, c - 1))
    }
  }

  function handleOpenNotification(n: Notification) {
    if (!n.is_read) markAsRead(n.id)
    if (n.action_url) {
      if (n.action_url.startsWith("/")) {
        router.push(n.action_url)
      } else {
        window.location.href = n.action_url
      }
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <h2 className="text-lg font-semibold">{supplier?.business_name || "Supplier Dashboard"}</h2>
      </div>
      <div className="flex items-center gap-4 relative">
        {/* Notifications bell as dropdown — uses same Card/Badge styling as notifications page */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadOrders > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-medium text-white animate-pulse">
                  {unreadOrders}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[28rem] max-h-[60vh] overflow-auto p-3">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between">
                <span className="font-medium">Notifications</span>
                <span className="text-xs text-muted-foreground">{unreadOrders} unread</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-2">
              {loadingNotifications ? (
                <p className="text-sm text-muted-foreground p-3">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No notifications</p>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type as keyof typeof typeIcons] || Bell
                  return (
                    <Card
                      key={n.id}
                      className={`p-2 ${n.is_read ? "bg-muted/30" : "bg-background"} cursor-pointer`}
                      onClick={() => handleOpenNotification(n)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              n.is_read ? "bg-muted" : "bg-primary/10"
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${n.is_read ? "text-muted-foreground" : "text-primary"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm">{n.title}</h3>
                                  {!n.is_read && (
                                    <Badge variant="default" className="text-xs">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          {!n.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(n.id)
                              }}
                              className="text-xs rounded bg-slate-800 px-2 py-1 text-white"
                            >
                              Mark
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/notifications")} className="justify-center">
              View all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {supplier?.business_name?.[0] || "S"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{supplier?.business_name}</p>
                <p className="text-xs leading-none text-muted-foreground">{supplier?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings/business")}>Business Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
