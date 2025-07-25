'use client';

import { useState, useEffect } from 'react';
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import Badge from "@/components/UI/Badge";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import { supabase, InventoryItem } from '@/lib/supabase';
import Image from 'next/image';

const categories = [
  "Sarees (Cotton)",
  "Sarees (Pattu)",
  "Sarees (Gadwal)",
  "Sarees (Narayanpet)",
  "Sarees (Ikkat)",
  "Sarees (Uppada)",
  "Sarees (Mangalgiri)",
  "Kurtis & Tops",
  "Dress Materials",
  "Lehengas",
  "Dupattas",
  "Salwar Suits",
  "Blouses",
  "Nighties",
  "Petticoats",
  "Shawls & Stoles",
  "Skirts & Ghagras",
  "Leggings",
  "Chudidars",
  "Gowns",
  "Langa Voni (Half Saree)",
  "Saree Falls & Accessories",
  "Others",
  "Other (Custom)"
];

function toCSV(items: InventoryItem[]) {
  const header = [
    "Name",
    "Category",
    "Description",
    "Cost Price",
    "Selling Price",
    "Quantity",
    "Added Date"
  ];
  const rows = items.map(item => [
    item.name,
    item.category,
    item.description,
    item.cost_price,
    item.selling_price,
    item.quantity,
    item.created_at
  ]);
  return [header, ...rows].map(row => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

interface VariantForm {
  name: string;
  color: string;
  quantity: string;
  selling_price: string;
  image: string;
}

interface VariantDB {
  id: string;
  name: string;
  category: string;
  description: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  has_variants?: boolean;
  base_item_id?: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    cost_price: '',
    selling_price: '',
    quantity: '',
    image: '',
    has_variants: false,
  });
  const [customCategory, setCustomCategory] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [priceType, setPriceType] = useState<'selling_price' | 'cost_price'>('selling_price');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [variantEditForm, setVariantEditForm] = useState<VariantForm | null>(null);
  const [newVariants, setNewVariants] = useState<VariantForm[]>([]);
  const [existingVariants, setExistingVariants] = useState<VariantDB[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [variantSuccessMessage, setVariantSuccessMessage] = useState('');

  // Move fetchInventory above handleRefresh
  const fetchInventory = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      alert('Error fetching inventory: ' + error.message);
      setItems([]);
    } else if (data) {
      setItems(data as VariantDB[]);
    }
    setFetching(false);
  };

  // Fetch variants for the main item when editing
  useEffect(() => {
    if (editingItem && editingItem.has_variants) {
      (async () => {
        const { data: variantRows } = await supabase
          .from('inventory')
          .select('*')
          .eq('base_item_id', editingItem.id)
          .order('created_at', { ascending: true });
        setExistingVariants(variantRows || []);
      })();
    } else if (!editingItem) {
      setExistingVariants([]);
    }
  }, [editingItem]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? item.category === filterCategory : true;
    const price = typeof item[priceType] === 'string' ? parseFloat(item[priceType]) : item[priceType];
    const matchesRange = price >= priceRange[0] && price <= priceRange[1];
    const matchesStock = inStockOnly ? item.quantity > 0 : true;
    return matchesSearch && matchesCategory && matchesRange && matchesStock;
  });

  const handleDownloadCSV = () => {
    const csv = toCSV(filteredItems);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    if (editingItem && editingItem.has_variants) {
      const { data: variantRows } = await supabase
        .from('inventory')
        .select('*')
        .eq('base_item_id', editingItem.id)
        .order('created_at', { ascending: true });
      setExistingVariants(variantRows || []);
    }
    setRefreshing(false);
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.category || !formData.description) return;
    setLoading(true);
    let imageUrl = '';
    if (formData.image) {
      // Convert dataURL to File
      function dataURLtoFile(dataurl: string, filename: string) {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
        return new File([u8arr], filename, { type: mime });
      }
      const file = dataURLtoFile(formData.image, `${formData.name.replace(/\s+/g, '_')}_${Date.now()}.png`);
      const { error } = await supabase.storage.from('inventory-images').upload(file.name, file, { upsert: true });
      if (error) {
        alert('Image upload failed: ' + (error as Error).message);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('inventory-images').getPublicUrl(file.name);
      imageUrl = publicUrlData.publicUrl;
    }
    // Always set has_variants true if variants are present
    const hasVariants = formData.has_variants || (newVariants && newVariants.length > 0);
    // Insert the main item
    const { data: insertedItem, error: insertError } = await supabase.from('inventory').insert([
      {
        name: formData.name,
        category: formData.category === 'Other (Custom)' ? customCategory : formData.category,
        description: formData.description,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseInt(formData.quantity),
        image_url: imageUrl,
        has_variants: hasVariants,
      },
    ]).select().single();
    if (insertError) {
      alert('Failed to add item: ' + insertError.message);
      setLoading(false);
      return;
    }
    // If there are variants, insert them
    const variantInsertErrors: string[] = [];
    if (hasVariants && newVariants.length > 0 && insertedItem) {
      const variantPromises = newVariants.map(async (variant) => {
        let variantImageUrl = '';
        if (variant.image) {
          function dataURLtoFile(dataurl: string, filename: string) {
            const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
            return new File([u8arr], filename, { type: mime });
          }
          const file = dataURLtoFile(variant.image, `${variant.name.replace(/\s+/g, '_')}_${Date.now()}.png`);
          const { error } = await supabase.storage.from('inventory-images').upload(file.name, file, { upsert: true });
          if (error) {
            console.error('Variant image upload failed:', error);
            variantInsertErrors.push('Image upload failed for variant: ' + variant.name);
            return;
          }
          const { data: publicUrlData } = supabase.storage.from('inventory-images').getPublicUrl(file.name);
          variantImageUrl = publicUrlData.publicUrl;
        }
        const { error: variantInsertError } = await supabase.from('inventory').insert([
          {
            name: variant.name || `${formData.name} - ${variant.color}`,
            category: formData.category === 'Other (Custom)' ? customCategory : formData.category,
            description: `${formData.description} - ${variant.color} variant`,
            cost_price: parseFloat(formData.cost_price),
            selling_price: parseFloat(variant.selling_price) || parseFloat(formData.selling_price),
            quantity: parseInt(variant.quantity) || 0,
            image_url: variantImageUrl,
            has_variants: false,
            base_item_id: insertedItem.id,
          },
        ]);
        if (variantInsertError) {
          console.error('Variant insert failed:', variantInsertError);
          variantInsertErrors.push('Insert failed for variant: ' + variant.name);
        }
      });
      await Promise.all(variantPromises);
    }
    if (variantInsertErrors.length > 0) {
      alert('Some variants failed to add: ' + variantInsertErrors.join(', '));
    } else if (hasVariants && newVariants.length > 0) {
      alert('All variants added successfully!');
    }
    setSuccessMessage('Item successfully added!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setShowAddForm(false);
    setFormData({
      name: '',
      category: '',
      description: '',
      cost_price: '',
      selling_price: '',
      quantity: '',
      image: '',
      has_variants: false,
    });
    setCustomCategory('');
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setItems(data as InventoryItem[]);
    setLoading(false);
    // Trigger events to refresh admin dashboard
    localStorage.setItem('inventory-updated', Date.now().toString());
    window.dispatchEvent(new Event('inventory-updated'));
    localStorage.setItem('dashboard-data-updated', Date.now().toString());
    window.dispatchEvent(new Event('dashboard-data-updated'));
    if (hasVariants && newVariants.length > 0 && insertedItem) {
      await supabase
        .from('inventory')
        .update({ has_variants: true })
        .eq('id', insertedItem.id);
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      cost_price: item.cost_price.toString(),
      selling_price: item.selling_price.toString(),
      quantity: item.quantity.toString(),
      image: item.image_url || '',
      has_variants: false,
    });
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    setLoading(true);
    try {
      // Always set has_variants true if variants are present
      const hasVariants = formData.has_variants || (newVariants && newVariants.length > 0);
      // Update the main item
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          name: formData.name,
          category: formData.category === 'Other (Custom)' ? customCategory : formData.category,
          description: formData.description,
          cost_price: parseFloat(formData.cost_price),
          selling_price: parseFloat(formData.selling_price),
          quantity: parseInt(formData.quantity),
          image_url: formData.image,
          has_variants: hasVariants,
        })
        .eq('id', editingItem.id);
      if (updateError) {
        alert('Failed to update item: ' + updateError.message);
        setLoading(false);
        return;
      }
      // Insert new variants if any
      const variantInsertErrors: string[] = [];
      if (hasVariants && newVariants.length > 0) {
        const variantPromises = newVariants.map(async (variant) => {
          let variantImageUrl = '';
          if (variant.image) {
            function dataURLtoFile(dataurl: string, filename: string) {
              const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
              for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
              return new File([u8arr], filename, { type: mime });
            }
            const file = dataURLtoFile(variant.image, `${variant.name.replace(/\s+/g, '_')}_${Date.now()}.png`);
            const { error } = await supabase.storage.from('inventory-images').upload(file.name, file, { upsert: true });
            if (error) {
              console.error('Variant image upload failed:', error);
              variantInsertErrors.push('Image upload failed for variant: ' + variant.name);
              return;
            }
            const { data: publicUrlData } = supabase.storage.from('inventory-images').getPublicUrl(file.name);
            variantImageUrl = publicUrlData.publicUrl;
          }
          const { error: variantInsertError } = await supabase.from('inventory').insert([
            {
              name: variant.name || `${formData.name} - ${variant.color}`,
              category: formData.category === 'Other (Custom)' ? customCategory : formData.category,
              description: `${formData.description} - ${variant.color} variant`,
              cost_price: parseFloat(formData.cost_price),
              selling_price: parseFloat(variant.selling_price) || parseFloat(formData.selling_price),
              quantity: parseInt(variant.quantity) || 0,
              image_url: variantImageUrl,
              has_variants: false,
              base_item_id: editingItem.id,
            },
          ]);
          if (variantInsertError) {
            console.error('Variant insert failed:', variantInsertError);
            variantInsertErrors.push('Insert failed for variant: ' + variant.name);
          }
        });
        await Promise.all(variantPromises);
      }
      if (variantInsertErrors.length > 0) {
        alert('Some variants failed to add: ' + variantInsertErrors.join(', '));
      } else if (hasVariants && newVariants.length > 0) {
        alert('All variants added successfully!');
      }
      setSuccessMessage('Item successfully updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Refresh the inventory list
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: true });
      if (!fetchError && data) {
        setItems(data as InventoryItem[]);
      }
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        cost_price: '',
        selling_price: '',
        quantity: '',
        image: '',
        has_variants: false,
      });
      setCustomCategory('');
      // Trigger events to refresh admin dashboard
      localStorage.setItem('inventory-updated', Date.now().toString());
      window.dispatchEvent(new Event('inventory-updated'));
      localStorage.setItem('dashboard-data-updated', Date.now().toString());
      window.dispatchEvent(new Event('dashboard-data-updated'));
      if (hasVariants && newVariants.length > 0) {
        await supabase
          .from('inventory')
          .update({ has_variants: true })
          .eq('id', editingItem.id);
      }
    } catch (error) {
      alert('Error updating item: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);

        if (error) {
          alert('Failed to delete item: ' + error.message);
          return;
        }

        setSuccessMessage('Item successfully deleted!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Refresh the inventory list
        const { data, error: fetchError } = await supabase
          .from('inventory')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (!fetchError && data) {
          setItems(data as InventoryItem[]);
        }
        
        // Trigger events to refresh admin dashboard
        localStorage.setItem('inventory-updated', Date.now().toString());
        window.dispatchEvent(new Event('inventory-updated'));
        localStorage.setItem('dashboard-data-updated', Date.now().toString());
        window.dispatchEvent(new Event('dashboard-data-updated'));
      } catch (error) {
        alert('Error deleting item: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      cost_price: '',
      selling_price: '',
      quantity: '',
      image: '',
      has_variants: false,
    });
    setNewVariants([]);
    setExistingVariants([]);
    setCustomCategory('');
  };

  const resetFilters = () => {
    setFilterCategory('');
    setPriceRange([0, 3000]);
    setSearchTerm('');
    setPriceType('selling_price');
    setInStockOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase">INVENTORY MANAGEMENT</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your store inventory</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={handleRefresh} variant="secondary" size="sm" disabled={refreshing}>
            {refreshing ? <span className="animate-spin mr-2">🔄</span> : <span className="mr-2">🔄</span>}
            Refresh
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center py-2 sm:py-2.5 px-4 text-base">
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search items by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Download CSV Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={handleDownloadCSV} variant="secondary" className="flex items-center py-2 sm:py-2.5 px-4 text-base">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
          Download CSV
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded border border-green-300 text-center">
          {successMessage}
          <div className="text-xs text-green-700 mt-1">
            ✓ Admin dashboard will be updated automatically
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingItem) && (
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {formData.category === 'Other (Custom)' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                  className="w-full mt-2 px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                rows={3}
                placeholder="Enter item description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, image: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              {formData.image && (
                <Image src={formData.image} alt="Preview" width={48} height={48} className="mt-2 h-24 object-contain border rounded" />
              )}
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="hasVariants"
                  checked={formData.has_variants}
                  onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <label htmlFor="hasVariants" className="text-sm font-medium text-gray-700">
                  This item has multiple colors/variants
                </label>
              </div>
            </div>
          </div>

          {/* Variants Section (add new variants) */}
          {formData.has_variants && (
            <div className="mt-8">
              <h4 className="text-base font-semibold mb-2">Add Variants</h4>
              {variantSuccessMessage && (
                <div className="mb-2 p-2 bg-green-100 text-green-800 rounded border border-green-300 text-center text-sm">
                  {variantSuccessMessage}
                </div>
              )}
              <div className="space-y-4">
                {newVariants.map((variant, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Variant Name</label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={e => {
                            const updated = [...newVariants];
                            updated[index].name = e.target.value;
                            setNewVariants(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={e => {
                            const updated = [...newVariants];
                            updated[index].color = e.target.value;
                            setNewVariants(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={variant.quantity}
                          onChange={e => {
                            const updated = [...newVariants];
                            updated[index].quantity = e.target.value;
                            setNewVariants(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.selling_price}
                          onChange={e => {
                            const updated = [...newVariants];
                            updated[index].selling_price = e.target.value;
                            setNewVariants(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Variant Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const updated = [...newVariants];
                              updated[index].image = reader.result as string;
                              setNewVariants(updated);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {variant.image && (
                        <Image src={variant.image} alt="Variant Preview" width={48} height={48} className="mt-2 h-16 object-contain border rounded" />
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          // Insert this variant into Supabase
                          setLoading(true);
                          let variantImageUrl = '';
                          if (variant.image) {
                            function dataURLtoFile(dataurl: string, filename: string) {
                              const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                              for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
                              return new File([u8arr], filename, { type: mime });
                            }
                            const file = dataURLtoFile(variant.image, `${variant.name.replace(/\s+/g, '_')}_${Date.now()}.png`);
                            const { error } = await supabase.storage.from('inventory-images').upload(file.name, file, { upsert: true });
                            if (!error) {
                              const { data: publicUrlData } = supabase.storage.from('inventory-images').getPublicUrl(file.name);
                              variantImageUrl = publicUrlData.publicUrl;
                            }
                          }
                          const { error: variantInsertError } = await supabase.from('inventory').insert([
                            {
                              name: variant.name,
                              category: formData.category === 'Other (Custom)' ? customCategory : formData.category,
                              description: `${formData.description} - ${variant.color} variant`,
                              cost_price: parseFloat(formData.cost_price),
                              selling_price: parseFloat(variant.selling_price) || parseFloat(formData.selling_price),
                              quantity: parseInt(variant.quantity) || 0,
                              image_url: variantImageUrl,
                              has_variants: false,
                              base_item_id: editingItem ? editingItem.id : null,
                            },
                          ]);
                          setLoading(false);
                          if (variantInsertError) {
                            setVariantSuccessMessage('Failed to add variant: ' + variant.name);
                          } else {
                            setVariantSuccessMessage('Variant added successfully!');
                            // Remove the variant from the form
                            setNewVariants(newVariants.filter((_, i) => i !== index));
                            // Optionally, refetch variants for the item
                            if (editingItem) {
                              const { data: variantRows } = await supabase
                                .from('inventory')
                                .select('*')
                                .eq('base_item_id', editingItem.id)
                                .order('created_at', { ascending: true });
                              setExistingVariants(variantRows || []);
                            }
                          }
                          setTimeout(() => setVariantSuccessMessage(''), 2000);
                        }}
                      >Add Variant</Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => setNewVariants(newVariants.filter((_, i) => i !== index))}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setNewVariants([...newVariants, { name: '', color: '', quantity: '', selling_price: '', image: '' }])}
              >+ Add Another Variant</Button>
            </div>
          )}

          {/* Existing Variants Section (edit/delete) */}
          {editingItem && formData.has_variants && existingVariants.length > 0 && (
            <div className="mt-8">
              <h4 className="text-base font-semibold mb-2">Existing Variants</h4>
              <div className="space-y-4">
                {existingVariants.map((variant, idx) => (
                  <div key={variant.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                    {editingVariantIndex === idx ? (
                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Variant Name</label>
                            <input
                              type="text"
                              value={variantEditForm ? variantEditForm.name : ''}
                              onChange={e => setVariantEditForm(variantEditForm ? { ...variantEditForm, name: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                            <input
                              type="text"
                              value={variantEditForm ? variantEditForm.color : ''}
                              onChange={e => setVariantEditForm(variantEditForm ? { ...variantEditForm, color: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={variantEditForm ? variantEditForm.quantity : ''}
                              onChange={e => setVariantEditForm(variantEditForm ? { ...variantEditForm, quantity: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variantEditForm ? variantEditForm.selling_price : ''}
                              onChange={e => setVariantEditForm(variantEditForm ? { ...variantEditForm, selling_price: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Variant Image (Optional)</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file && variantEditForm) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setVariantEditForm({ ...variantEditForm, image: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          {variantEditForm && variantEditForm.image && (
                            <Image src={variantEditForm.image} alt="Variant Preview" width={48} height={48} className="mt-2 h-16 object-contain border rounded" />
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              if (!variantEditForm) {
                                alert('Variant form is not loaded.');
                                return;
                              }
                              const { error } = await supabase
                                .from('inventory')
                                .update({
                                  name: variantEditForm.name,
                                  quantity: parseInt(variantEditForm.quantity),
                                  selling_price: parseFloat(variantEditForm.selling_price),
                                })
                                .eq('id', variant.id);
                              if (error) {
                                alert('Failed to update variant: ' + error.message);
                              } else {
                                setEditingVariantIndex(null);
                                // Refetch variants
                                const { data: variantRows } = await supabase
                                  .from('inventory')
                                  .select('*')
                                  .eq('base_item_id', editingItem.id)
                                  .order('created_at', { ascending: true });
                                setExistingVariants(variantRows || []);
                              }
                            }}
                          >Save</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => setEditingVariantIndex(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{variant.name}</div>
                          <div className="text-xs text-gray-500">Qty: {variant.quantity} | Price: ₹{variant.selling_price}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => {
                            setEditingVariantIndex(idx);
                            setVariantEditForm({
                              name: variant.name || '',
                              color: '',
                              quantity: variant.quantity?.toString() || '',
                              selling_price: variant.selling_price?.toString() || '',
                              image: variant.image_url || '',
                            });
                          }}>Edit</Button>
                          <Button type="button" size="sm" variant="danger" onClick={async () => {
                            if (confirm('Are you sure you want to delete this variant?')) {
                              const { error } = await supabase.from('inventory').delete().eq('id', variant.id);
                              if (error) {
                                alert('Failed to delete variant: ' + error.message);
                              } else {
                                // Refetch variants
                                const { data: variantRows } = await supabase
                                  .from('inventory')
                                  .select('*')
                                  .eq('base_item_id', editingItem.id)
                                  .order('created_at', { ascending: true });
                                setExistingVariants(variantRows || []);
                              }
                            }
                          }}>Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons (Save/Cancel) */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
            <Button variant="secondary" onClick={handleCancel} className="w-full sm:w-auto py-2 sm:py-2.5 text-base">
              Cancel
            </Button>
            <Button
              onClick={editingItem ? handleUpdateItem : handleAddItem}
              disabled={!formData.name || !formData.category || !formData.description || loading}
              className="w-full sm:w-auto py-2 sm:py-2.5 text-base"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingItem ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                editingItem ? 'Update Item' : 'Add Item'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">All</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by</label>
          <select
            value={priceType}
            onChange={e => setPriceType(e.target.value as 'selling_price' | 'cost_price')}
            className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="selling_price">Selling Price</option>
            <option value="cost_price">Cost Price</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price Range ({priceType === 'selling_price' ? 'Selling' : 'Cost'})</label>
          <div className="flex items-center gap-2">
            <span>{priceRange[0]}</span>
            <input
              type="range"
              min="0"
              max="3000"
              step="1"
              value={priceRange[0]}
              onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="w-32"
            />
            <span>-</span>
            <input
              type="range"
              min="0"
              max="3000"
              step="1"
              value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-32"
            />
            <span>{priceRange[1]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="inStockOnly"
            checked={inStockOnly}
            onChange={e => setInStockOnly(e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <label htmlFor="inStockOnly" className="text-sm text-gray-700">In stock only</label>
        </div>
        <div className="self-end">
          <Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        {fetching ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading inventory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full divide-y divide-gray-200 text-sm sm:text-base">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">No inventory items found.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 sm:px-6 py-4">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.name} width={48} height={48} className="w-12 h-12 object-contain rounded border bg-white" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded border">
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                              <path d="M8 15l2-2a2 2 0 0 1 2.83 0l2.34 2.34M8 11h.01M16 11h.01" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">{item.category}</Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{Number(item.cost_price).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">₹{Number(item.selling_price).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-1 text-gray-400" />
                          <span className={`text-sm font-semibold ${item.quantity < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity}
                          </span>
                          {item.quantity < 5 && (
                            <Badge variant="danger" size="sm" className="ml-2">Low Stock</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="flex items-center"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex items-center"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
} 