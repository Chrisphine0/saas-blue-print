import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, DollarSign, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { redirect } from "next/navigation"
import type { Supplier } from "@/lib/types"

export default async function SupplierInvoicesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()
  const supplier = (supplierRes as any).data
  
  if (!supplier) redirect("/onboarding")

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      order:orders(order_number, status),
      buyer:buyers(business_name, contact_person, email)
    `)
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })

  const totalRevenue = invoices?.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const pendingAmount = invoices?.filter((inv) => ["pending", "sent"].includes(inv.status)).reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const overdueCount = invoices?.filter((inv) => inv.status === "overdue").length || 0

  return (
    <div className="space-y-6 pb-20 md:pb-6"> {/* Bottom padding for mobile nav */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Invoices</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your invoices and payments</p>
      </div>

      {/* Stats Grid - Stacked on mobile, 3-col on md */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">KES {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">KES {pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="px-4 py-4 md:px-6">
          <CardTitle className="text-lg">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="px-2 md:px-6"> {/* Less padding on mobile to save space */}
          <div className="space-y-3">
            {invoices?.map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl bg-card hover:bg-accent/50 transition-colors gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm md:text-base">#{invoice.invoice_number}</span>
                    <Badge
                      className="text-[10px] px-2 py-0"
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "overdue"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm font-medium truncate">
                    {invoice.buyer?.business_name || "Unknown Buyer"}
                  </p>
                  
                  <div className="flex flex-col text-xs text-muted-foreground space-y-0.5">
                    <span>Order #{invoice.order?.order_number || "N/A"}</span>
                    <span>Due {formatDistanceToNow(new Date(invoice.due_date), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Amount and Action - Fixed bottom-right on mobile or side on desktop */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground sm:hidden">Total Amount</p>
                    <p className="text-lg font-black text-primary">
                      KES {invoice.total_amount.toLocaleString()}
                    </p>
                  </div>
                  
                  <Button variant="outline" size="sm" asChild className="h-9 px-4 sm:mt-2">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

            {(!invoices || invoices.length === 0) && (
              <div className="text-center py-16">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No invoices found</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Your billing history will appear here once orders are processed.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}