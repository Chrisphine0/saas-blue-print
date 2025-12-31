import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { PaymentForm } from "@/components/payment-form"

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

  if (!user) {
    return notFound()
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return notFound()
  }

  // Get invoice with details
  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      order:orders(*),
      supplier:suppliers(*)
    `)
    .eq("id", id)
    .eq("buyer_id", buyer.id)
    .single()

  if (!invoice) {
    return notFound()
  }

  // Get order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      *,
      product:products(name, sku)
    `)
    .eq("order_id", invoice.order_id)

  // Get payments for this invoice
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoice.id)
    .order("created_at", { ascending: false })

  const totalPaid = payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0
  const remainingAmount = invoice.total_amount - totalPaid

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/buyer/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">Order #{invoice.order.order_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : "secondary"}
          >
            {invoice.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">From</p>
                  <p className="font-semibold">{invoice.supplier.business_name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.supplier.email}</p>
                  <p className="text-sm text-muted-foreground">{invoice.supplier.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To</p>
                  <p className="font-semibold">{buyer.business_name}</p>
                  <p className="text-sm text-muted-foreground">{buyer.email}</p>
                  <p className="text-sm text-muted-foreground">{buyer.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{format(new Date(invoice.created_at), "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <p className="font-medium">{format(new Date(invoice.due_date), "PPP")}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems?.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                        </td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">KES {item.unit_price.toLocaleString()}</td>
                        <td className="text-right">KES {item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-b">
                      <td colSpan={3} className="text-right py-2 font-medium">
                        Subtotal
                      </td>
                      <td className="text-right py-2">KES {invoice.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td colSpan={3} className="text-right py-2 font-medium">
                        Tax
                      </td>
                      <td className="text-right py-2">KES {invoice.tax_amount.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="text-right py-2 font-bold text-lg">
                        Total
                      </td>
                      <td className="text-right py-2 font-bold text-lg">KES {invoice.total_amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {payments && payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{payment.payment_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_method.toUpperCase()} • {format(new Date(payment.payment_date), "PPP")}
                        </p>
                        {payment.transaction_reference && (
                          <p className="text-xs text-muted-foreground">Ref: {payment.transaction_reference}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">KES {payment.amount.toLocaleString()}</p>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
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

        <div>
          {invoice.status !== "paid" && remainingAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Make Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
                    <p className="text-2xl font-bold">KES {remainingAmount.toLocaleString()}</p>
                  </div>
                  <PaymentForm
                    invoiceId={invoice.id}
                    orderId={invoice.order_id}
                    buyerId={buyer.id}
                    supplierId={invoice.supplier_id}
                    amount={remainingAmount}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          {invoice.status === "paid" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold">Invoice Paid</p>
                  <p className="text-sm text-muted-foreground">
                    Paid on {invoice.paid_date && format(new Date(invoice.paid_date), "PPP")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}