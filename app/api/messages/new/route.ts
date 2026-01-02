// app/api/messages/new/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { buyer_id, supplier_id, message } = await req.json()
  const supabase = await createServerClient()

  // Try to find existing conversation
  let { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("buyer_id", buyer_id)
    .eq("supplier_id", supplier_id)
    .single()

  if (convError && convError.code !== "PGRST116") { // Handle no rows error
    return NextResponse.json({ error: "Error fetching conversation" }, { status: 500 })
  }

  if (!conversation) {
    // Create new conversation
    const { data: newConv, error: newConvError } = await supabase
      .from("conversations")
      .insert({ buyer_id, supplier_id })
      .select("*")
      .single()
    if (newConvError) return NextResponse.json({ error: "Could not start conversation" }, { status: 500 })
    conversation = newConv
  }

  // Insert message
  const { error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      sender_type: "buyer",
      sender_id: buyer_id,
      message,
      is_read: false,
    })

  if (msgError) return NextResponse.json({ error: "Could not post message" }, { status: 500 })

  return NextResponse.json({ ok: true })
}