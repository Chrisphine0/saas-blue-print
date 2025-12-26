"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  FileText,
  DollarSign,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/admin/dashboard/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Suppliers",
    href: "/admin/dashboard/suppliers",
    icon: <Store className="h-5 w-5" />,
  },
  {
    title: "Buyers",
    href: "/admin/dashboard/buyers",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    title: "Orders",
    href: "/admin/dashboard/orders",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Commissions",
    href: "/admin/dashboard/commissions",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    title: "Analytics",
    href: "/admin/dashboard/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Verifications",
    href: "/admin/dashboard/verifications",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/admin/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["super_admin"],
  },
]

export function AdminNav({ adminRole }: { adminRole: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        if (item.roles && !item.roles.includes(adminRole)) {
          return null
        }
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
