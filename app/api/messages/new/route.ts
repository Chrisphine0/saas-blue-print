// app/api/messages/new/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { buyer_id, supplier_id, message, order_id } = await req.json()
    const supabase = await createServerClient()

    // 1. Find or Create Conversation
    // We filter by order_id too. If order_id is null, it looks for a general chat.
    let query = supabase
      .from("conversations")
      .select("id")
      .eq("buyer_id", buyer_id)
      .eq("supplier_id", supplier_id)

    if (order_id) {
      query = query.eq("order_id", order_id)
    } else {
      query = query.is("order_id", null)
    }

    let { data: conversation, error: convError } = await query.maybeSingle()

    if (convError) return NextResponse.json({ error: convError.message }, { status: 500 })

    if (!conversation) {
      const { data: newConv, error: newConvError } = await supabase
        .from("conversations")
        .insert({ 
          buyer_id, 
          supplier_id, 
          order_id: order_id || null, // Optional link to order
          status: 'active',
          last_message_at: new Date().toISOString() 
        })
        .select()
        .single()
      
      if (newConvError) return NextResponse.json({ error: newConvError.message }, { status: 500 })
      conversation = newConv
    }

    // 2. Insert message
    const { error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_type: "buyer",
        sender_id: buyer_id,
        message: message.trim(),
      })

    if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}