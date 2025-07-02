'use client';

import { useState, useEffect } from 'react';
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import Badge from "@/components/UI/Badge";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import { supabase, InventoryItem } from '@/lib/supabase';

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
  });
  const [customCategory, setCustomCategory] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [priceType, setPriceType] = useState<'selling_price' | 'cost_price'>('selling_price');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch inventory from Supabase on mount
  useEffect(() => {
    const fetchInventory = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching inventory:', error.message);
      } else if (data) {
        setItems(data as InventoryItem[]);
      }
      setFetching(false);
    };
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
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('inventory-images').getPublicUrl(file.name);
      imageUrl = publicUrlData.publicUrl;
    }
    const { error: insertError } = await supabase.from('inventory').insert([
      {
        name: formData.name,
        category: formData.category === 'Other (Custom)' ? customCategory : formData.category,
        description: formData.description,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseInt(formData.quantity),
        image_url: imageUrl,
      },
    ]);
    if (insertError) {
      alert('Failed to add item: ' + insertError.message);
      return;
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
    });
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          name: formData.name,
          category: formData.category === 'Other (Custom)' ? customCategory : formData.category,
          description: formData.description,
          cost_price: parseFloat(formData.cost_price),
          selling_price: parseFloat(formData.selling_price),
          quantity: parseInt(formData.quantity),
          image_url: formData.image,
        })
        .eq('id', editingItem.id);

      if (error) {
        alert('Failed to update item: ' + error.message);
        return;
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
      });
      setCustomCategory('');
      
      // Trigger events to refresh admin dashboard
      localStorage.setItem('inventory-updated', Date.now().toString());
      window.dispatchEvent(new Event('inventory-updated'));
      localStorage.setItem('dashboard-data-updated', Date.now().toString());
      window.dispatchEvent(new Event('dashboard-data-updated'));
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
    });
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your store inventory</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center py-2 sm:py-2.5 px-4 text-base">
          <Plus className="w-4 h-4 mr-2" />
          Add New Item
        </Button>
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
                <img src={formData.image} alt="Preview" className="mt-2 h-24 object-contain border rounded" />
              )}
            </div>
          </div>
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
                    <td colSpan={6} className="text-center py-8 text-gray-500">No inventory items found.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
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