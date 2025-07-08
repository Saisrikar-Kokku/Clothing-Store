export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import ProductDetailClient from "@/components/ProductDetailClient";

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );
}

async function ProductDetailContent({ params }: { params: { id: string } }) {
  // Fetch the main item
  const { data: item, error: itemError } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', params.id)
    .single();

  if (itemError || !item) {
    notFound();
  }

  // Fetch variants if this item has variants
  let variants = [];
  if (item.has_variants) {
    const { data: variantsData, error: variantsError } = await supabase
      .from('inventory')
      .select('*')
      .eq('base_item_id', item.id)
      .order('created_at', { ascending: true });

    if (!variantsError && variantsData) {
      variants = variantsData;
    }
  }

  // Fetch parent item if this is a variant
  let parentItem = null;
  if (item.base_item_id) {
    const { data: parent, error: parentError } = await supabase
      .from('inventory')
      .select('id, name, image_url')
      .eq('id', item.base_item_id)
      .single();
    if (!parentError && parent) {
      parentItem = parent;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductDetailClient item={item} variants={variants} parentItem={parentItem} />
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
} 