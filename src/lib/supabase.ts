import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface InventoryItem {
  id: string
  name: string
  category: string
  description: string
  cost_price: number
  selling_price: number
  quantity: number
  image_url?: string
  created_at: string
  updated_at: string
  has_variants?: boolean
  base_item_id?: string // For variants, this points to the main item
}

export interface ItemVariant {
  id: string
  base_item_id: string
  name: string
  color: string
  size?: string
  quantity: number
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  items_supplied: string[]
  amount_paid: number
  amount_due: number
  phone?: string | null
  due_date?: string | null
  created_at: string
}

export interface PendingPayment {
  id: string
  customer_name: string
  items: string[]
  amount_due: number
  due_date: string
  created_at: string
}

export interface Sale {
  id: string
  item_id: string
  item_name: string
  quantity_sold: number
  selling_price: number
  total_revenue: number
  sale_date: string
  created_at: string
} 