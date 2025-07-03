"use client";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import { Package } from "lucide-react";
import { useState } from "react";

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  selling_price: number;
  quantity: number;
  created_at: string;
}

// Helper for INR currency formatting
function formatPrice(price: number) {
  return price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

const ITEMS_PER_PAGE = 12;

export default function CatalogClient({ items }: { items: CatalogItem[] }) {
  // Unique categories for filter
  const allCategories = Array.from(new Set(items.map(item => item.category)));

  // Client-side state for filters and pagination
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState<number>(1);

  // Filter items
  let filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort items
  if (sortBy === "price-asc") {
    filteredItems = filteredItems.sort((a, b) => a.selling_price - b.selling_price);
  } else if (sortBy === "price-desc") {
    filteredItems = filteredItems.sort((a, b) => b.selling_price - a.selling_price);
  } else if (sortBy === "newest") {
    filteredItems = filteredItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Group paginated items by category
  const itemsByCategory = paginatedItems.reduce((acc: Record<string, typeof items>, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const categories = Object.keys(itemsByCategory);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search catalog by name or description"
        />
        <select
          value={selectedCategory}
          onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {allCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); setPage(1); }}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Sort items"
        >
          <option value="newest">Sort: Newest</option>
          <option value="price-asc">Sort: Price Low to High</option>
          <option value="price-desc">Sort: Price High to Low</option>
        </select>
      </div>

      {/* Categories */}
      <div className="space-y-8 sm:space-y-12">
        {categories.length === 0 ? (
          <div className="text-center text-gray-500">No items match your filters.</div>
        ) : (
          categories.map((category) => (
            <section key={category}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{category}</h2>
                <Badge variant="info" className="text-xs px-2 py-1">
                  {itemsByCategory[category].length} items
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                {itemsByCategory[category].map((item) => (
                  <Card key={item.id} className="hover:shadow-lg hover:scale-[1.03] transition-transform duration-200 p-2 sm:p-4">
                    {item.image_url ? (
                      <div className="relative w-full h-24 sm:h-32 bg-white rounded mb-1 sm:mb-2 flex items-center justify-center">
                        <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-contain p-1" />
                      </div>
                    ) : (
                      <div className="relative w-full h-24 sm:h-32 flex items-center justify-center bg-gray-100 rounded mb-1 sm:mb-2">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                          <path d="M8 15l2-2a2 2 0 0 1 2.83 0l2.34 2.34M8 11h.01M16 11h.01" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </div>
                    )}
                    <h3 className="text-xs sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-1 sm:mb-2 text-xs sm:text-sm">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="text-xs sm:text-lg font-bold text-green-600">
                          {formatPrice(item.selling_price)}
                        </span>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <Package className="w-4 h-4 mr-1" />
                          {item.quantity}
                        </div>
                      </div>
                      <Badge variant={item.quantity < 5 ? "danger" : "default"} className="text-xs px-2 py-1">
                        {item.quantity < 5 ? "Low Stock" : "In Stock"}
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
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`px-3 py-1 rounded ${page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              onClick={() => setPage(i + 1)}
              aria-label={`Go to page ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}

      {/* Category Summary */}
      <div className="mt-12 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allCategories.map((category) => (
            <div key={category} className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {items.filter(item => item.category === category).length}
              </div>
              <div className="text-sm text-gray-600">{category}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
} 