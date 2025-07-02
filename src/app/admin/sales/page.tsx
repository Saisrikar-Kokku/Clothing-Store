'use client';
import { useEffect, useState } from "react";
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import { TrendingUp, Calendar, Plus, Pencil, X, Trash2 } from "lucide-react";
import { supabase, Sale, InventoryItem } from "@/lib/supabase";

function toCSV(sales: Sale[]) {
  const header = [
    "Date",
    "Item",
    "Quantity Sold",
    "Selling Price",
    "Total Revenue"
  ];
  const rows = sales.map(sale => [
    sale.sale_date,
    sale.item_name,
    sale.quantity_sold,
    sale.selling_price,
    sale.total_revenue
  ]);
  return [header, ...rows].map(row => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [form, setForm] = useState({
    item_id: "",
    item_name: "",
    quantity_sold: "",
    selling_price: "",
    sale_date: new Date().toISOString().slice(0, 10),
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    item_name: "",
    quantity_sold: "",
    selling_price: "",
    sale_date: new Date().toISOString().slice(0, 10),
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sale_date", { ascending: false });
    if (error) {
      setError(error.message);
      setSales([]);
    } else if (data && data.length > 0) {
      setSales(data as Sale[]);
    } else {
      setSales([]);
    }
    setLoading(false);
    localStorage.setItem('dashboard-data-updated', Date.now().toString());
    window.dispatchEvent(new Event('dashboard-data-updated'));
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    const { data, error } = await supabase.from("inventory").select("id, name, selling_price, quantity, category, description, cost_price, image_url, created_at, user_id");
    if (error) {
      setInventoryError(error.message);
      setInventory([]);
    } else if (data) {
      setInventory(
        (data as Partial<InventoryItem>[]).map((item) => ({
          id: item.id || "",
          name: item.name || "",
          selling_price: item.selling_price || 0,
          quantity: item.quantity || 0,
          category: item.category || "",
          description: item.description || "",
          cost_price: item.cost_price || 0,
          image_url: item.image_url || undefined,
          created_at: item.created_at || "",
          updated_at: "",
        }))
      );
    }
    setInventoryLoading(false);
  };

  useEffect(() => {
    fetchSales();
    fetchInventory();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "item_id") {
      const selected = inventory.find((item) => item.id === e.target.value);
      setForm((prev) => ({
        ...prev,
        item_id: selected?.id || "",
        item_name: selected?.name || "",
        selling_price: selected?.selling_price?.toString() || "",
      }));
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage("");
    if (!form.item_id || !form.item_name || !form.quantity_sold || !form.selling_price || !form.sale_date) {
      setFormError("All fields are required.");
      return;
    }
    setFormLoading(true);
    const quantity = parseInt(form.quantity_sold, 10);
    const price = parseFloat(form.selling_price);
    const total_revenue = quantity * price;
    const { error } = await supabase.from("sales").insert([
      {
        item_id: form.item_id,
        item_name: form.item_name,
        quantity_sold: quantity,
        selling_price: price,
        total_revenue,
        sale_date: form.sale_date,
      },
    ]);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMessage("Sale added successfully!");
      setForm({
        item_id: "",
        item_name: "",
        quantity_sold: "",
        selling_price: "",
        sale_date: new Date().toISOString().slice(0, 10),
      });
      fetchSales();
    }
    setFormLoading(false);
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_revenue), 0);
  const totalItemsSold = sales.reduce((sum, sale) => sum + Number(sale.quantity_sold), 0);

  const handleDownloadCSV = () => {
    const csv = toCSV(sales);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditClick = (sale: Sale) => {
    setEditingId(sale.id);
    setEditForm({
      item_name: sale.item_name,
      quantity_sold: sale.quantity_sold.toString(),
      selling_price: sale.selling_price.toString(),
      sale_date: sale.sale_date ? sale.sale_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setEditError(null);
    setEditSuccess("");
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess("");
    if (!editForm.item_name || !editForm.quantity_sold || !editForm.selling_price || !editForm.sale_date) {
      setEditError("All fields are required.");
      return;
    }
    setEditLoading(true);
    const quantity = parseInt(editForm.quantity_sold, 10);
    const price = parseFloat(editForm.selling_price);
    const total_revenue = quantity * price;
    const { error } = await supabase
      .from("sales")
      .update({
        item_name: editForm.item_name,
        quantity_sold: quantity,
        selling_price: price,
        total_revenue,
        sale_date: editForm.sale_date,
      })
      .eq("id", editingId);
    if (error) {
      setEditError(error.message);
    } else {
      setEditSuccess("Sale updated successfully!");
      setEditingId(null);
      fetchSales();
    }
    setEditLoading(false);
    localStorage.setItem('dashboard-data-updated', Date.now().toString());
    window.dispatchEvent(new Event('dashboard-data-updated'));
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditError(null);
    setEditSuccess("");
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    setDeleteLoadingId(id);
    setDeleteError(null);
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      setDeleteError(error.message);
    } else {
      fetchSales();
      localStorage.setItem('dashboard-data-updated', Date.now().toString());
      window.dispatchEvent(new Event('dashboard-data-updated'));
    }
    setDeleteLoadingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">View sales data</p>
        </div>
      </div>

      {/* Add Sale Form */}
      <Card className="mb-6 sm:mb-8">
        {inventoryLoading && (
          <div className="mb-2 p-2 bg-blue-100 text-blue-800 rounded border border-blue-300 text-center">Loading inventory...</div>
        )}
        {inventoryError && (
          <div className="mb-2 p-2 bg-red-100 text-red-800 rounded border border-red-300 text-center">Error loading inventory: {inventoryError}</div>
        )}
        <form onSubmit={handleAddSale} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-end">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Item *</label>
            <select
              name="item_id"
              value={form.item_id}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              required
            >
              <option value="">Select item</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Quantity Sold *</label>
            <input
              type="number"
              name="quantity_sold"
              value={form.quantity_sold}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="0"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
            <input
              type="number"
              name="selling_price"
              value={form.selling_price}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
            <input
              type="date"
              name="sale_date"
              value={form.sale_date}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div className="sm:col-span-2 md:col-span-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-2">
            <Button type="submit" disabled={formLoading} className="w-full sm:w-auto py-2 sm:py-2.5 text-base">
              {formLoading ? "Adding..." : <><Plus className="w-4 h-4 mr-2" /> Add Sale</>}
            </Button>
            {formError && <span className="text-red-600 text-sm">{formError}</span>}
            {successMessage && <span className="text-green-600 text-sm">{successMessage}</span>}
          </div>
        </form>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items Sold</p>
              <p className="text-2xl font-bold text-blue-600">{totalItemsSold}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Download CSV Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={handleDownloadCSV} variant="secondary" className="flex items-center py-2 sm:py-2.5 px-4 text-base">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
          Download CSV
        </Button>
      </div>

      {/* Sales Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading sales...</span>
          </div>
        ) : error ? (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded border border-red-300 text-center">
            Error: {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full divide-y divide-gray-200 text-sm sm:text-base">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">No sales found.</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    editingId === sale.id ? (
                      <tr key={sale.id} className="bg-blue-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap" colSpan={7}>
                          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4 items-end">
                            <input
                              type="text"
                              name="item_name"
                              value={editForm.item_name}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Item name"
                              required
                            />
                            <input
                              type="number"
                              name="quantity_sold"
                              value={editForm.quantity_sold}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Quantity"
                              min="1"
                              required
                            />
                            <input
                              type="number"
                              name="selling_price"
                              value={editForm.selling_price}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Price"
                              min="0"
                              step="0.01"
                              required
                            />
                            <input
                              type="date"
                              name="sale_date"
                              value={editForm.sale_date}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              required
                            />
                            <div className="sm:col-span-2 md:col-span-5 flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                              <Button type="submit" size="sm" disabled={editLoading} className="w-full sm:w-auto py-2 sm:py-2.5 text-base">
                                {editLoading ? "Saving..." : "Save"}
                              </Button>
                              <Button type="button" size="sm" variant="secondary" onClick={handleEditCancel} className="w-full sm:w-auto py-2 sm:py-2.5 text-base">
                                <X className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                              {editError && <span className="text-red-600 text-sm">{editError}</span>}
                              {editSuccess && <span className="text-green-600 text-sm">{editSuccess}</span>}
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={sale.id}>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sale.sale_date}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{sale.item_name}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sale.quantity_sold}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-700">${sale.selling_price}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-700">${sale.total_revenue}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right flex flex-col sm:flex-row gap-2 sm:gap-0">
                          <Button size="sm" variant="secondary" onClick={() => handleEditClick(sale)} className="w-full sm:w-auto py-2 sm:py-2.5 text-base">
                            <Pencil className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="w-full sm:w-auto py-2 sm:py-2.5 text-base ml-0 sm:ml-2"
                            onClick={() => handleDeleteSale(sale.id)}
                            disabled={deleteLoadingId === sale.id}
                          >
                            {deleteLoadingId === sale.id ? (
                              <span>Deleting...</span>
                            ) : (
                              <><Trash2 className="w-4 h-4 mr-1" /> Delete</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    )
                  ))
                )}
                {deleteError && (
                  <tr>
                    <td colSpan={7} className="text-center p-2">
                      <div className="mb-2 p-2 bg-red-100 text-red-800 rounded border border-red-300 text-center">
                        Error: {deleteError}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
} 