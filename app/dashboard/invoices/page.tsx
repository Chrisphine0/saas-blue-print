import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, DollarSign, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { redirect } from "next/navigation"

export default async function SupplierInvoicesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError) {
    if (supplierStatus === 406) {
      redirect("/auth/login")
    }
  }

  if (!supplier) {
    return null
  }

  // Get invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      order:orders(order_number, status),
      buyer:buyers(business_name, contact_person, email)
    `)
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })

  // Calculate stats
  const totalRevenue =
    invoices?.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const pendingAmount =
    invoices
      ?.filter((inv) => inv.status === "pending" || inv.status === "sent")
      .reduce((sum, inv) => sum + inv.total_amount, 0) || 0
  const overdueCount = invoices?.filter((inv) => inv.status === "overdue").length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">Manage your invoices and payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices?.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{invoice.invoice_number}</h3>
                    <Badge
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
                  <p className="text-sm text-muted-foreground">
                    {invoice.buyer.business_name} • Order #{invoice.order.order_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due {formatDistanceToNow(new Date(invoice.due_date), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">KES {invoice.total_amount.toLocaleString()}</p>
                  <Button variant="outline" size="sm" asChild className="mt-2 bg-transparent">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {(!invoices || invoices.length === 0) && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No invoices yet</p>
                <p className="text-sm text-muted-foreground">
                  Invoices are created automatically when orders are confirmed
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}