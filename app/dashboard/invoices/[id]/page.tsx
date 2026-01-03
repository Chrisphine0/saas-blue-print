// app/dashboard/invoices/[id]/page.tsx
import { createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { InvoiceActions } from "@/components/invoice/InvoiceActions"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // ✅ 1. Get supplier profile instead of buyer
  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single()
  const supplier = supplierRes.data

  if (!supplier) redirect("/onboarding")

  // ✅ 2. Get invoice and ensure it belongs to this supplier
  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      order:orders(*),
      buyer:buyers(*)
    `)
    .eq("id", id)
    .eq("supplier_id", supplier.id) // Security check
    .single()

  if (!invoice) return notFound()

  // Get order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      *,
      product:products(name, sku)
    `)
    .eq("order_id", invoice.order_id)

  // Get payments
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoice.id)
    .order("created_at", { ascending: false })

  const totalPaid = payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0
  const remainingAmount = invoice.total_amount - totalPaid

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">Order #{invoice.order?.order_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className="capitalize"
            variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "secondary"}
          >
            {invoice.status}
          </Badge>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card id="invoice-card" className="print:shadow-none print:border-none">
            <CardHeader className="border-b">
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Billing Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">From (You)</p>
                  <p className="font-bold">{supplier.business_name}</p>
                  <p className="text-sm">{supplier.email}</p>
                  <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Bill To</p>
                  <p className="font-bold text-primary">{invoice.buyer?.business_name}</p>
                  <p className="text-sm">{invoice.buyer?.email}</p>
                  <p className="text-sm text-muted-foreground">{invoice.buyer?.phone}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y bg-slate-50/50 rounded-lg px-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Issue Date</p>
                  <p className="text-sm font-semibold">{format(new Date(invoice.created_at), "PPP")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Due Date</p>
                  <p className="text-sm font-semibold">{format(new Date(invoice.due_date), "PPP")}</p>
                </div>
              </div>

              {/* Items Table - Mobile Scrollable */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="text-left py-3 font-semibold">Product</th>
                      <th className="text-right py-3 font-semibold">Qty</th>
                      <th className="text-right py-3 font-semibold">Price</th>
                      <th className="text-right py-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orderItems?.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-4">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.product?.sku}</p>
                        </td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">KES {item.unit_price.toLocaleString()}</td>
                        <td className="text-right font-medium">KES {item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="text-sm">
                    <tr>
                      <td colSpan={3} className="text-right pt-6 pb-2 text-muted-foreground">Subtotal</td>
                      <td className="text-right pt-6 pb-2 font-medium">KES {invoice.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2 text-muted-foreground">Tax</td>
                      <td className="text-right py-2 font-medium">KES {invoice.tax_amount.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right pt-4 font-bold text-lg">Total Amount</td>
                      <td className="text-right pt-4 font-bold text-lg text-primary">KES {invoice.total_amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {payments && payments.length > 0 && (
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div>
                        <p className="text-sm font-bold">{payment.payment_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.payment_method.toUpperCase()} • {format(new Date(payment.payment_date), "PPP")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-700">KES {payment.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="text-[10px] h-5 bg-green-50">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6 print:hidden">
          <Card className="bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm opacity-90">Remaining Balance</p>
                <p className="text-3xl font-black">KES {remainingAmount.toLocaleString()}</p>
                {invoice.status === "paid" && (
                  <div className="flex items-center justify-center gap-2 text-xs bg-white/20 py-1 px-3 rounded-full w-fit mx-auto mt-4">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    FULLY PAID
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Manage Invoice</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
               {/* <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" /> Download Statement
               </Button>
               <Button variant="outline" className="w-full justify-start">
                  <Printer className="mr-2 h-4 w-4" /> Print Invoice
               </Button> */}
               <InvoiceActions invoiceNumber={invoice.invoice_number} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}