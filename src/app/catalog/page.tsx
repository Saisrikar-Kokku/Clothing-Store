export const dynamic = "force-dynamic";
import { Grid } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import CatalogClient from "@/components/CatalogClient";

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

async function CatalogContent() {
  // Fetch inventory items from Supabase
  const { data: items, error } = await supabase
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-center py-10 text-red-600">Failed to load items: {error.message}</div>;
  }

  if (!items || items.length === 0) {
    return <div className="text-center py-10 text-gray-500">No items available.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Grid className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Product Catalog</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse our collection organized by categories. 
          Find exactly what you&apos;re looking for.
        </p>
      </div>
      <CatalogClient items={items} />
    </div>
  );
}

export default function Catalog() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CatalogContent />
    </Suspense>
  );
} 