// app/api/send-invoice-email/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import sendEmail from "@/lib/sendEmail" // Hypothetical email sending function

export async function POST(req: Request) {
  const { invoiceId, buyerEmail, invoiceDetails } = await req.json()
  const supabase = await createServerClient()

  // Fetch the invoice details if not provided
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }

  // Send email
  const emailResult = await sendEmail({
    to: buyerEmail,
    subject: `Invoice #${invoice.invoice_number}`,
    text: `Here are your invoice details: ${JSON.stringify(invoiceDetails || invoice)}`,
    html: `<h1>Invoice #${invoice.invoice_number}</h1><p>Details: ${JSON.stringify(invoiceDetails || invoice)}</p>`,
  })

  if (!emailResult.success) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}