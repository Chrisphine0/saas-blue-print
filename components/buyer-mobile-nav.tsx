"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Package, Heart, Building2 } from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/buyer/dashboard",
    icon: Home,
  },
  {
    title: "Catalog",
    href: "/buyer/dashboard/catalog",
    icon: ShoppingCart,
  },
  {
    title: "Orders",
    href: "/buyer/dashboard/orders",
    icon: Package,
  },
  {
    title: "Favorites",
    href: "/buyer/dashboard/favorites",
    icon: Heart,
  },
  {
    title: "MarketPlace",
    href: "/buyer/dashboard/marketplace",
    icon: Building2,
  },
]

export function BuyerMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/buyer/dashboard" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-0 flex-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate w-full text-center">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}