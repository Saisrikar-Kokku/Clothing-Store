import Card from "@/components/UI/Card";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import Badge from "@/components/UI/Badge";
import { Package } from "lucide-react";

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

// Helper for category badge color
const categoryColors: Record<string, string> = {
  'Sarees (Cotton)': 'info',
  'Sarees (Pattu)': 'warning',
  'Kurtis & Tops': 'success',
  'Dress Materials': 'danger',
  'Lehengas': 'info',
  'Dupattas': 'warning',
  'Salwar Suits': 'success',
  'Blouses': 'danger',
  'Nighties': 'info',
  'Petticoats': 'warning',
  'Shawls & Stoles': 'success',
  'Skirts & Ghagras': 'danger',
  'Leggings': 'info',
  'Chudidars': 'warning',
  'Gowns': 'success',
  'Langa Voni (Half Saree)': 'danger',
  'Saree Falls & Accessories': 'info',
  'Others': 'default',
  'Other (Custom)': 'default',
};

// Helper for INR currency formatting
function formatPrice(price: number) {
  return price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

async function HomeContent() {
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

  // Sort by creation date to show new arrivals first
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const newArrivals = sortedItems.slice(0, 2);
  const allItems = sortedItems;

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-2 md:px-4 lg:px-8 py-4 sm:py-6">
      {/* Hero Section */}
      <div className="text-center mb-6 sm:mb-10">
        <h1
          className="text-3xl sm:text-5xl font-extrabold mb-2 sm:mb-4 harika-gradient-heading animate-fade-in-slow"
          style={{ letterSpacing: '0.03em', lineHeight: 1.1 }}
        >
          Welcome to <span className="inline-block harika-gradient-move">Harika Clothing Store</span>
        </h1>
        <p className="text-base sm:text-xl text-gray-700 max-w-2xl mx-auto animate-fade-in-slow delay-150">
          Discover beautiful women&apos;s clothing and accessories.<br/>
          Browse our latest arrivals and find your perfect style.
        </p>
      </div>

      {/* New Arrivals Section */}
      <section className="mb-6 sm:mb-10">
        <div className="flex items-center mb-3 sm:mb-5">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mr-2" />
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">New Arrivals</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {newArrivals.map((item) => (
            <Card key={item.id} className="hover:shadow-lg hover:scale-[1.03] transition-transform duration-200 p-3 sm:p-4">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full min-h-24 max-h-60 sm:max-h-80 object-contain bg-white rounded mb-2" />
              ) : (
                <div className="w-full min-h-24 max-h-60 sm:max-h-80 flex items-center justify-center bg-gray-100 rounded mb-2">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8 15l2-2a2 2 0 0 1 2.83 0l2.34 2.34M8 11h.01M16 11h.01" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{item.name}</h3>
                {item.quantity < 5 ? (
                  <Badge variant="danger" size="sm">Low Stock</Badge>
                ) : (
                  <Badge variant="success" size="sm">New</Badge>
                )}
              </div>
              <p className="text-gray-600 mb-2 text-xs sm:text-base">{item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className="text-sm sm:text-lg font-bold text-green-600">
                    {formatPrice(item.selling_price)}
                  </span>
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <Package className="w-4 h-4 mr-1" />
                    {item.quantity} in stock
                  </div>
                </div>
                <Badge variant={categoryColors[item.category] as 'info' | 'warning' | 'success' | 'danger' | 'default' || 'default'}>
                  {item.category}
                </Badge>
              </div>
              <button
                className="mt-2 w-auto px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                aria-label={`View details for ${item.name}`}
                disabled
              >
                View Details
              </button>
            </Card>
          ))}
        </div>
      </section>

      {/* All Items Section */}
      <section>
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">All Available Items</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {allItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg hover:scale-[1.03] transition-transform duration-200 p-3 sm:p-4">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full min-h-24 max-h-60 sm:max-h-80 object-contain bg-white rounded mb-2" />
              ) : (
                <div className="w-full min-h-24 max-h-60 sm:max-h-80 flex items-center justify-center bg-gray-100 rounded mb-2">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8 15l2-2a2 2 0 0 1 2.83 0l2.34 2.34M8 11h.01M16 11h.01" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              )}
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-2 text-xs sm:text-sm">{item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className="text-sm sm:text-lg font-bold text-green-600">
                    {formatPrice(item.selling_price)}
                  </span>
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <Package className="w-4 h-4 mr-1" />
                    {item.quantity}
                  </div>
                </div>
                <Badge variant={categoryColors[item.category] as 'info' | 'warning' | 'success' | 'danger' | 'default' || 'default'}>
                  {item.category}
                </Badge>
              </div>
              <button
                className="mt-2 w-auto px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                aria-label={`View details for ${item.name}`}
                disabled
              >
                View Details
              </button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* Async Server Component */}
      <HomeContent />
    </Suspense>
  );
}
