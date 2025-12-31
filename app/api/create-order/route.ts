import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, buyerId, paymentMethod, deliveryAddress, deliveryCity, notes } = body

    if (!items || !buyerId || !deliveryAddress || !deliveryCity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Group items by supplier
    const itemsBySupplier: Record<string, { supplier: any; items: any[] }> = {}
    for (const item of items) {
      const supplierId = item.product.supplier_id
      if (!itemsBySupplier[supplierId]) {
        itemsBySupplier[supplierId] = { supplier: item.product.supplier, items: [] }
      }
      itemsBySupplier[supplierId].items.push(item)
    }

    // Create orders for each supplier
    for (const [supplierId, supplierData] of Object.entries(itemsBySupplier)) {
      const supplierTotal = supplierData.items.reduce(
        (sum, item) => sum + item.product.price_per_unit * item.quantity,
        0,
      )

      const orderNumber = `ORD-${Date.now().toString(36)}-${Math.floor(Math.random() * 9000) + 1000}`

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: buyerId,
          supplier_id: supplierId,
          order_number: orderNumber,
          total_amount: supplierTotal,
          payment_method: paymentMethod,
          delivery_address: deliveryAddress,
          delivery_city: deliveryCity,
          notes: notes,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single()

      if (orderError) {
        console.error("server create order error", orderError)
        return NextResponse.json({ error: orderError }, { status: 500 })
      }

      const orderItems = supplierData.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price_per_unit,
        subtotal: item.product.price_per_unit * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
      if (itemsError) {
        console.error("server create order items error", itemsError)
        return NextResponse.json({ error: itemsError }, { status: 500 })
      }

      // Update inventory: subtract ordered quantity from available and add to reserved
      for (const item of supplierData.items) {
        const inventory = item.product.inventory?.[0]
        if (inventory) {
          const newAvailable = Math.max(0, (Number(inventory.quantity_available) || 0) - Number(item.quantity))
          const newReserved = (Number(inventory.quantity_reserved) || 0) + Number(item.quantity)

          const updateQuery = supabase.from("inventory").update({
            quantity_available: newAvailable,
            quantity_reserved: newReserved,
          })

          // Prefer matching by inventory id when available for precision
          if (inventory.id) {
            updateQuery.eq("id", inventory.id)
          } else {
            updateQuery.eq("product_id", item.product_id)
          }

          const { error: inventoryError } = await updateQuery

          if (inventoryError) {
            console.error("server inventory update error", inventoryError)
            return NextResponse.json({ error: inventoryError }, { status: 500 })
          }
        }
      }
    }

    // Clear cart for buyer
    const { error: clearError } = await supabase.from("cart_items").delete().eq("buyer_id", buyerId)
    if (clearError) {
      console.error("server clear cart error", clearError)
      return NextResponse.json({ error: clearError }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("create-order route error", err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
