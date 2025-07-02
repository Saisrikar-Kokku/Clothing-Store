'use client';

import { useEffect, useState } from "react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import Button from "@/components/UI/Button";
import { AlertTriangle, Plus, Pencil, X, Trash2 } from "lucide-react";
import { supabase, Supplier } from "@/lib/supabase";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    items_supplied: "",
    amount_paid: "",
    amount_due: "",
    phone: "",
    due_date: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    items_supplied: "",
    amount_paid: "",
    amount_due: "",
    phone: "",
    due_date: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setSuppliers([]);
    } else if (data && data.length > 0) {
      setSuppliers(data as Supplier[]);
    } else {
      setSuppliers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage("");
    if (!form.name) {
      setFormError("Supplier name is required.");
      return;
    }
    setFormLoading(true);
    const itemsSuppliedArr = form.items_supplied
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const { error } = await supabase.from("suppliers").insert([
      {
        name: form.name,
        items_supplied: itemsSuppliedArr,
        amount_paid: form.amount_paid ? parseFloat(form.amount_paid) : 0,
        amount_due: form.amount_due ? parseFloat(form.amount_due) : 0,
        phone: form.phone || null,
        due_date: form.due_date || null,
      },
    ]);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMessage("Supplier added successfully!");
      setForm({
        name: "",
        items_supplied: "",
        amount_paid: "",
        amount_due: "",
        phone: "",
        due_date: "",
      });
      fetchSuppliers();
      localStorage.setItem('dashboard-data-updated', Date.now().toString());
      window.dispatchEvent(new Event('dashboard-data-updated'));
    }
    setFormLoading(false);
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setEditForm({
      name: supplier.name,
      items_supplied: supplier.items_supplied?.join(", ") || "",
      amount_paid: supplier.amount_paid?.toString() || "",
      amount_due: supplier.amount_due?.toString() || "",
      phone: supplier.phone || "",
      due_date: supplier.due_date ? supplier.due_date.slice(0, 10) : "",
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
    if (!editForm.name) {
      setEditError("Supplier name is required.");
      return;
    }
    setEditLoading(true);
    const itemsSuppliedArr = editForm.items_supplied
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const { error } = await supabase
      .from("suppliers")
      .update({
        name: editForm.name,
        items_supplied: itemsSuppliedArr,
        amount_paid: editForm.amount_paid ? parseFloat(editForm.amount_paid) : 0,
        amount_due: editForm.amount_due ? parseFloat(editForm.amount_due) : 0,
        phone: editForm.phone || null,
        due_date: editForm.due_date || null,
      })
      .eq("id", editingId);
    if (error) {
      setEditError(error.message);
    } else {
      setEditSuccess("Supplier updated successfully!");
      setEditingId(null);
      fetchSuppliers();
      localStorage.setItem('dashboard-data-updated', Date.now().toString());
      window.dispatchEvent(new Event('dashboard-data-updated'));
    }
    setEditLoading(false);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditError(null);
    setEditSuccess("");
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    setDeleteLoadingId(id);
    setDeleteError(null);
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      setDeleteError(error.message);
    } else {
      fetchSuppliers();
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your suppliers and track payments</p>
        </div>
      </div>

      {/* Add Supplier Form */}
      <Card className="mb-6 sm:mb-8">
        <form onSubmit={handleAddSupplier} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 items-end">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Supplier name"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Items Supplied (comma separated)</label>
            <input
              type="text"
              name="items_supplied"
              value={form.items_supplied}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="e.g. Sarees, Kurtis"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
            <input
              type="number"
              name="amount_paid"
              value={form.amount_paid}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount Due</label>
            <input
              type="number"
              name="amount_due"
              value={form.amount_due}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleFormChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="sm:col-span-2 md:col-span-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-2">
            <Button type="submit" disabled={formLoading} className="w-full sm:w-auto py-2 sm:py-2.5 text-base">
              {formLoading ? "Adding..." : <><Plus className="w-4 h-4 mr-2" /> Add Supplier</>}
            </Button>
            {formError && <span className="text-red-600 text-sm">{formError}</span>}
            {successMessage && <span className="text-green-600 text-sm">{successMessage}</span>}
          </div>
        </form>
      </Card>

      {/* Suppliers Table */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading suppliers...</span>
        </div>
      ) : error ? (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded border border-red-300 text-center">
          Error: {error}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full divide-y divide-gray-200 text-sm sm:text-base">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Supplied</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">No suppliers found.</td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    editingId === supplier.id ? (
                      <tr key={supplier.id} className="bg-blue-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap" colSpan={6}>
                          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 sm:gap-4 items-end">
                            <input
                              type="text"
                              name="name"
                              value={editForm.name}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Supplier name"
                              required
                            />
                            <input
                              type="text"
                              name="items_supplied"
                              value={editForm.items_supplied}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Items supplied"
                            />
                            <input
                              type="number"
                              name="amount_paid"
                              value={editForm.amount_paid}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Amount paid"
                              min="0"
                              step="0.01"
                            />
                            <input
                              type="number"
                              name="amount_due"
                              value={editForm.amount_due}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Amount due"
                              min="0"
                              step="0.01"
                            />
                            <input
                              type="text"
                              name="phone"
                              value={editForm.phone}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                              placeholder="Phone"
                            />
                            <input
                              type="date"
                              name="due_date"
                              value={editForm.due_date}
                              onChange={handleEditFormChange}
                              className="px-2 py-2 sm:py-2.5 border border-gray-300 rounded w-full text-sm sm:text-base"
                            />
                            <div className="sm:col-span-2 md:col-span-6 flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
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
                      <tr key={supplier.id}>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {supplier.items_supplied?.join(", ")}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-green-700 font-semibold">${supplier.amount_paid}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={supplier.amount_due > 0 ? "text-red-700 font-semibold" : "text-gray-700"}>
                            ${supplier.amount_due}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          {supplier.amount_due > 0 ? (
                            <Badge variant="danger" className="flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-1" /> Due
                            </Badge>
                          ) : (
                            <Badge variant="success">Paid</Badge>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right flex flex-col sm:flex-row gap-2 sm:gap-0">
                          <Button size="sm" variant="secondary" onClick={() => handleEditClick(supplier)} className="w-full sm:w-auto py-2 sm:py-2.5 text-base">
                            <Pencil className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="w-full sm:w-auto py-2 sm:py-2.5 text-base ml-0 sm:ml-2"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            disabled={deleteLoadingId === supplier.id}
                          >
                            {deleteLoadingId === supplier.id ? (
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
              </tbody>
            </table>
          </div>
          {deleteError && (
            <div className="mb-2 p-2 bg-red-100 text-red-800 rounded border border-red-300 text-center">
              Error: {deleteError}
            </div>
          )}
        </Card>
      )}
    </div>
  );
} 