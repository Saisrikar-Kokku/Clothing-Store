"use client";
import { useState } from "react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import { Package, ArrowLeft, Palette, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface ProductDetailItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  selling_price: number;
  quantity: number;
  created_at: string;
  has_variants?: boolean;
  base_item_id?: string;
}

// Helper for INR currency formatting
function formatPrice(price: number) {
  return price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function ProductDetailClient({ 
  item, 
  variants, 
  parentItem 
}: { 
  item: ProductDetailItem; 
  variants: ProductDetailItem[]; 
  parentItem?: { id: string; name: string; image_url?: string } | null;
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductDetailItem | null>(null);

  const displayItem = selectedVariant || item;
  const hasVariants = item.has_variants && variants.length > 0;

  return (
    <div className="space-y-8">
      {/* Parent Item Section */}
      {parentItem && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded mb-4">
          {parentItem.image_url ? (
            <img src={parentItem.image_url} alt={parentItem.name} className="w-16 h-16 object-contain rounded border bg-white" />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M8 15l2-2a2 2 0 0 1 2.83 0l2.34 2.34M8 11h.01M16 11h.01" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500 mb-1">Parent Item</div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-blue-700">{parentItem.name}</span>
              <a
                href={`/catalog/${parentItem.id}`}
                className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-medium shadow"
                style={{ textDecoration: 'none' }}
              >
                Back to Main Product
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Link 
        href="/catalog" 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Catalog
      </Link>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative w-full h-96 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
            {displayItem.image_url ? (
              <img 
                src={displayItem.image_url} 
                alt={displayItem.name} 
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M8 15l2-2a2 2 0 0 1 2.83 0l2.34 2.34M8 11h.01M16 11h.01" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>

          {/* Variant Images Grid */}
          {hasVariants && (
            <div className="grid grid-cols-4 gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`relative w-full h-20 bg-white rounded border-2 transition-all ${
                    selectedVariant?.id === variant.id 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {variant.image_url ? (
                    <img 
                      src={variant.image_url} 
                      alt={variant.name} 
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Palette className="w-6 h-6" />
                    </div>
                  )}
                  {selectedVariant?.id === variant.id && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge variant="default" className="mb-2">
              {displayItem.category}
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {displayItem.name}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {displayItem.description}
            </p>
          </div>

          {/* Price and Stock */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(displayItem.selling_price)}
              </span>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-semibold text-gray-900">
                  {displayItem.quantity} in stock
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {displayItem.quantity > 0 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Available</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Out of Stock</span>
                </div>
              )}
              {displayItem.quantity < 5 && displayItem.quantity > 0 && (
                <Badge variant="danger">Low Stock</Badge>
              )}
            </div>
          </div>

          {/* Variants Section */}
          {hasVariants && (
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Palette className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Colors/Variants
                </h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedVariant?.id === variant.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {variant.image_url && (
                        <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden">
                          <img 
                            src={variant.image_url} 
                            alt={variant.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <span className="font-medium text-sm">{variant.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{formatPrice(variant.selling_price)}</span>
                      <span className="flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {variant.quantity}
                      </span>
                    </div>
                    {variant.quantity === 0 && (
                      <Badge variant="danger" size="sm" className="mt-1">
                        Out of Stock
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* No Variants Message */}
          {!hasVariants && (
            <Card className="p-6 bg-gray-50">
              <div className="flex items-center text-gray-600">
                <Palette className="w-5 h-5 mr-2" />
                <span>No color variants available for this item.</span>
              </div>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Interested in this item?
            </h3>
            <p className="text-blue-800 mb-4">
              Contact us to place an order or inquire about availability.
            </p>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center">
                <span className="font-medium">Phone:</span>
                <a href="tel:+918500581272" className="ml-2 underline hover:text-blue-600">+918500581272</a>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Email:</span>
                <a href="mailto:saisrikarkokku7674@gmail.com" className="ml-2 underline hover:text-blue-600">saisrikarkokku7674@gmail.com</a>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Store Location:</span>
                <a href="https://maps.app.goo.gl/WxZF4YzeFAEZBHqE6" target="_blank" rel="noopener noreferrer" className="ml-2 underline hover:text-blue-600">View on Map</a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 