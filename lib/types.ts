export interface Supplier {
  id: string
  user_id: string
  business_name: string
  business_registration?: string
  tax_id?: string
  phone: string
  email: string
  address?: string
  city?: string
  country: string
  logo_url?: string
  verified: boolean
  status: "active" | "suspended" | "pending"
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  supplier_id: string
  category_id?: string
  name: string
  description?: string
  sku: string
  barcode?: string
  unit_of_measure: "pcs" | "kg" | "ltr" | "box" | "carton"
  price_per_unit: number
  min_order_quantity: number
  max_order_quantity?: number
  bulk_pricing?: Array<{ min_qty: number; price: number }>
  lead_time_days: number
  status: "active" | "inactive" | "out_of_stock"
  images?: string[]
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: string
  product_id: string
  supplier_id: string
  quantity_available: number
  quantity_reserved: number
  reorder_level: number
  reorder_quantity: number
  last_restocked_at?: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  buyer_id: string
  supplier_id: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  total_amount: number
  payment_status: "pending" | "partial" | "paid" | "refunded"
  payment_method?: string
  delivery_address: string
  delivery_city: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  created_at: string
}

export interface Buyer {
  id: string
  user_id: string
  business_name: string
  contact_person: string
  phone: string
  email: string
  address?: string
  city?: string
  country: string
  credit_limit: number
  verified: boolean
  status: "active" | "suspended" | "pending"
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  buyer_id: string
  product_id: string
  quantity: number
  added_at: string
  product?: Product
}

export interface BuyerFavorite {
  id: string
  buyer_id: string
  product_id: string
  added_at: string
  product?: Product
}

export interface ReorderAlert {
  id: string
  buyer_id: string
  product_id: string
  threshold_quantity: number
  alert_frequency: "daily" | "weekly" | "monthly"
  is_active: boolean
  last_alerted_at?: string
  created_at: string
  product?: Product
}

export interface ProductReview {
  id: string
  product_id: string
  buyer_id: string
  order_id: string
  rating: number
  review_text?: string
  status: "pending" | "published" | "hidden"
  helpful_count: number
  verified_purchase: boolean
  created_at: string
  updated_at: string
  buyer?: Buyer
}

export interface ProductWithDetails extends Product {
  supplier?: Supplier
  inventory?: Inventory
  category?: Category
  reviews?: ProductReview[]
  average_rating?: number
  total_reviews?: number
}

export interface Admin {
  id: string
  auth_id: string
  email: string
  full_name: string
  role: "super_admin" | "admin" | "support"
  permissions: string[]
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface PlatformSettings {
  id: string
  key: string
  value: any
  description?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  admin_id: string
  action: string
  resource_type: string
  resource_id?: string
  details?: any
  ip_address?: string
  created_at: string
  admin?: Admin
}

export interface UserVerification {
  id: string
  user_type: "supplier" | "buyer"
  user_id: string
  status: "pending" | "approved" | "rejected"
  verified_by?: string
  verification_notes?: string
  documents?: any[]
  created_at: string
  updated_at: string
}

export interface CommissionRecord {
  id: string
  order_id: string
  supplier_id: string
  order_total: number
  commission_rate: number
  commission_amount: number
  status: "pending" | "paid" | "cancelled"
  paid_at?: string
  created_at: string
  order?: Order
  supplier?: Supplier
}

export interface Conversation {
  id: string
  buyer_id: string
  supplier_id: string
  order_id?: string
  subject?: string
  status: "active" | "archived" | "resolved"
  last_message_at?: string
  created_at: string
  updated_at: string
  buyer?: Buyer
  supplier?: Supplier
  order?: Order
  unread_count?: number
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: "buyer" | "supplier" | "admin"
  sender_id: string
  message: string
  attachments?: any[]
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  order_id: string
  buyer_id: string
  supplier_id: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  status: "pending" | "sent" | "paid" | "overdue" | "cancelled"
  due_date: string
  paid_date?: string
  notes?: string
  created_at: string
  updated_at: string
  order?: Order
  buyer?: Buyer
  supplier?: Supplier
}

export interface Payment {
  id: string
  payment_number: string
  invoice_id: string
  order_id: string
  buyer_id: string
  supplier_id: string
  amount: number
  payment_method: "mpesa" | "bank_transfer" | "cash" | "credit" | "check"
  transaction_reference?: string
  status: "pending" | "processing" | "completed" | "failed" | "refunded"
  payment_date: string
  notes?: string
  created_at: string
  updated_at: string
  invoice?: Invoice
  order?: Order
}

export interface Delivery {
  id: string
  tracking_number: string
  order_id: string
  buyer_id: string
  supplier_id: string
  driver_name?: string
  driver_phone?: string
  vehicle_number?: string
  status: "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned"
  pickup_address?: string
  delivery_address: string
  estimated_delivery_date?: string
  actual_delivery_date?: string
  delivery_notes?: string
  signature_url?: string
  proof_of_delivery_url?: string
  created_at: string
  updated_at: string
  order?: Order
  buyer?: Buyer
  supplier?: Supplier
  updates?: DeliveryUpdate[]
}

export interface DeliveryUpdate {
  id: string
  delivery_id: string
  status: string
  location?: string
  latitude?: number
  longitude?: number
  notes?: string
  updated_by?: string
  created_at: string
}

export interface Notification {
  id: string
  user_type: "buyer" | "supplier" | "admin"
  user_id: string
  type: "order" | "payment" | "delivery" | "message" | "system" | "review" | "inventory"
  title: string
  message: string
  action_url?: string
  is_read: boolean
  read_at?: string
  metadata?: any
  created_at: string
}

export interface SupplierReview {
  id: string
  supplier_id: string
  buyer_id: string
  order_id: string
  rating: number
  review_text?: string
  communication_rating?: number
  delivery_rating?: number
  quality_rating?: number
  status: "pending" | "published" | "hidden"
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  updated_at: string
  buyer?: Buyer
  order?: Order
}

export interface SupplierRating {
  id: string
  supplier_id: string
  average_rating: number
  total_reviews: number
  communication_rating: number
  delivery_rating: number
  quality_rating: number
  updated_at: string
}

export interface SupplierFollow {
  id: string
  buyer_id: string
  supplier_id: string
  created_at: string
}

export interface ProductView {
  id: string
  product_id: string
  buyer_id?: string
  viewed_at: string
}

export interface SupplierWithRating extends Supplier {
  rating?: SupplierRating
  is_following?: boolean
  product_count?: number
  follower_count?: number
}

export interface Promotion {
  id: string
  supplier_id: string
  code: string
  name: string
  description?: string
  type: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping"
  discount_value?: number
  min_order_amount?: number
  max_discount_amount?: number
  buy_quantity?: number
  get_quantity?: number
  applies_to: "all_products" | "specific_products" | "category"
  product_ids?: string[]
  category_ids?: string[]
  usage_limit?: number
  usage_count: number
  per_buyer_limit?: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromotionUsage {
  id: string
  promotion_id: string
  buyer_id: string
  order_id: string
  discount_amount: number
  used_at: string
  promotion?: Promotion
  buyer?: Buyer
  order?: Order
}
