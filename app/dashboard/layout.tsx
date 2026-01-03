// app/dashboard/layout.tsx
import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardHeader } from "@/components/dashboard-header"
import type { Supplier } from "@/lib/types"
import { Toaster } from "@/components/ui/toaster"
import { MessageCircle } from "lucide-react"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError && supplierStatus === 406) {
    redirect("/auth/login")
  }

  if (!supplier) {
    redirect("/onboarding")
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background">
      {/* Sidebar for large screens */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-muted/40 sticky top-0 h-screen">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-semibold">B2B Platform</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden py-4 px-3">
            <DashboardNav />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-h-0">
        <DashboardHeader supplier={supplier} />
        
        {/* ✅ FIXED: Added pb-24 for mobile and pb-6 for desktop */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Message Icon */}
      {/* ✅ FIXED: Positioned bottom-24 on mobile to stay above Nav + Padding */}
      <Link
        href="/dashboard/messages"
        className="fixed z-50 bottom-24 right-6 lg:bottom-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center active:scale-95"
        title="Messages"
        aria-label="Go to messages"
      >
        <MessageCircle className="h-6 w-6" />
      </Link>

      <Toaster />

      {/* Bottom navigation for mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="px-2 py-1">
          <DashboardNav />
        </div>
        {/* Safe area spacer for modern iPhones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}