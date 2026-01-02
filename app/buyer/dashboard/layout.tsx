// app/buyer/dashboard/layout.tsx - Buyer dashboard layout

import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BuyerDashboardNav } from "@/components/buyer-dashboard-nav"
import { BuyerMobileNav } from "@/components/buyer-mobile-nav"
import { BuyerDashboardHeader } from "@/components/buyer-dashboard-header"
import type { Buyer } from "@/lib/types"

export default async function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/buyer/auth/login")
  }

  // Get buyer profile
  const buyerRes = await supabase.from("buyers").select("*").eq("user_id", user.id).single<Buyer>()
  const buyer = (buyerRes as any).data
  const buyerError = (buyerRes as any).error
  const buyerStatus = (buyerRes as any).status

  if (buyerError) {
    if (buyerStatus === 406) {
      redirect("/buyer/auth/login")
    }
    // treat other errors as missing buyer
  }

  if (!buyer) {
    redirect("/buyer/onboarding")
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/40 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="font-semibold">B2B Platform</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-4 px-3">
            <BuyerDashboardNav />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <BuyerDashboardHeader buyer={buyer} />
        <main className="flex-1 overflow-auto p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BuyerMobileNav />
    </div>
  )
}