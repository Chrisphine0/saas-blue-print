import { Button } from "../components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <svg
                className="h-5 w-5 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-sm sm:text-xl font-bold truncate">
              B2B Ordering Platform
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Supplier Login</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/buyer/auth/login">Buyer Login</Link>
            </Button>
          </div>
        </div>

        {/* Mobile auth buttons */}
        <div className="flex sm:hidden gap-2 px-4 pb-3">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/auth/login">Supplier</Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/buyer/auth/login">Buyer</Link>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {/* Hero */}
        <section className="container px-4 py-16 sm:py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Streamline Your B2B Operations
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground">
              Manage products, track inventory, and process orders all in one platform.
              Built for wholesalers and suppliers in Africa.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/auth/signup">Start Selling</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="/auth/login">Supplier Login</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/40 py-16 sm:py-24">
          <div className="container px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-center text-2xl sm:text-3xl font-bold mb-10 sm:mb-12">
                Everything You Need to Grow
              </h2>

              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
                {/* Feature card */}
                {[
                  {
                    title: "Product Management",
                    desc:
                      "Easily add, edit, and organize your product catalog with bulk pricing support",
                    icon: (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    ),
                  },
                  {
                    title: "Order Processing",
                    desc:
                      "Manage orders from placement to delivery with real-time status updates",
                    icon: (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                      />
                    ),
                  },
                  {
                    title: "Smart Analytics",
                    desc:
                      "Track sales, inventory levels, and business performance with detailed reports",
                    icon: (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5m4 8V9a2 2 0 012-2h2"
                      />
                    ),
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="flex flex-col items-center text-center px-2"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {f.icon}
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      {f.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs sm:text-sm text-muted-foreground">
        <div className="container px-4">
          © 2025 B2B Ordering Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
