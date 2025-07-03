"use client";
import { useEffect, useState } from "react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import Button from "@/components/UI/Button";
import { Clock, AlertTriangle, Plus, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PendingPayment {
  id: string;
  type: string;
  related_id?: string | null;
  name: string;
  phone?: string | null;
  address?: string | null;
  amount: number;
  due_date?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

const defaultForm: Omit<PendingPayment, "id" | "created_at" | "updated_at"> = {
  type: "customer",
  related_id: null,
  name: "",
  phone: "",
  address: "",
  amount: 0,
  due_date: "",
  status: "pending",
  notes: "",
};

export default function PendingPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const today = new Date();

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("pending_payments")
      .select("*")
      .order("due_date", { ascending: true });
    if (error) setError(error.message);
    else setPayments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "amount" ? Number(value) : value }));
  };

  const openAddModal = () => {
    setForm({ ...defaultForm });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (payment: PendingPayment) => {
    setForm({
      type: payment.type,
      related_id: payment.related_id || null,
      name: payment.name,
      phone: payment.phone || "",
      address: payment.address || "",
      amount: payment.amount,
      due_date: payment.due_date || "",
      status: payment.status || "pending",
      notes: payment.notes || "",
    });
    setEditId(payment.id);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    if (!form.name || !form.amount || !form.due_date) {
      setFormError("Name, Amount, and Due Date are required.");
      setFormLoading(false);
      return;
    }
    if (editId) {
      // Edit mode
      const { error } = await supabase
        .from("pending_payments")
        .update({ ...form })
        .eq("id", editId);
      if (error) {
        setFormError(error.message);
      } else {
        setShowModal(false);
        setForm({ ...defaultForm });
        setEditId(null);
        fetchPayments();
        localStorage.setItem('dashboard-data-updated', Date.now().toString());
        window.dispatchEvent(new Event('dashboard-data-updated'));
      }
    } else {
      // Add mode
      const { error } = await supabase.from("pending_payments").insert([{ ...form }]);
      if (error) {
        setFormError(error.message);
      } else {
        setShowModal(false);
        setForm({ ...defaultForm });
        fetchPayments();
        localStorage.setItem('dashboard-data-updated', Date.now().toString());
        window.dispatchEvent(new Event('dashboard-data-updated'));
      }
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("pending_payments").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      fetchPayments();
      localStorage.setItem('dashboard-data-updated', Date.now().toString());
      window.dispatchEvent(new Event('dashboard-data-updated'));
    }
    // Optionally, show error feedback if needed
  };

  const handleMarkAsPaid = async (id: string) => {
    setMarkingPaidId(id);
    const { error } = await supabase.from("pending_payments").update({ status: "paid" }).eq("id", id);
    if (!error) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      setMarkingPaidId(null);
      fetchPayments();
      localStorage.setItem('dashboard-data-updated', Date.now().toString());
      window.dispatchEvent(new Event('dashboard-data-updated'));
    }
    // Optionally, show error feedback if needed
  };

  const getStatusBadge = (dueDate: string, status: string) => {
    const due = new Date(dueDate);
    const isOverdue = due < today;
    if (isOverdue || status === "overdue") {
      return (
        <Badge variant="danger" className="flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Overdue
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="flex items-center">
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </Badge>
    );
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  // Only consider unpaid payments for summary cards
  const unpaidPayments = payments.filter((p) => p.status !== "paid");
  const totalPending = unpaidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const overdueCount = unpaidPayments.filter(
    (p) => p.status === "overdue" || (p.due_date && new Date(p.due_date) < today)
  ).length;
  const totalCustomers = unpaidPayments.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-2 overflow-y-auto">
           <div className="bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-sm md:max-w-md p-3 sm:p-6 relative mx-auto my-8 flex flex-col gap-2">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => { setShowModal(false); setEditId(null); }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-4">{editId ? "Edit Payment" : "Add Pending Payment"}</h2>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  name="phone"
                  value={form.phone || ""}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  name="address"
                  value={form.address || ""}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                <input
                  name="amount"
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date *</label>
                <input
                  name="due_date"
                  type="date"
                  value={form.due_date || ""}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={form.status || "pending"}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes || ""}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <Button type="submit" className="w-full" disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Payment"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Payments</h1>
          <p className="text-gray-600 mt-2">Track customer payments and manage overdue accounts</p>
        </div>
        <Button className="flex items-center" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{Number(totalPending).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-blue-600">{totalCustomers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending payments found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.filter((p) => p.status !== "paid").map((p) => (
                  <tr key={p.id} className={p.status === "overdue" || (p.due_date && new Date(p.due_date) < today) ? "bg-red-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{p.phone || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{p.address || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600">₹{Number(p.amount).toLocaleString("en-IN")}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{p.due_date || "-"}</div>
                      <div className="text-xs text-gray-500">{getDaysUntilDue(p.due_date || "")}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(p.due_date || "", p.status || "")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{p.notes || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="secondary" size="sm" onClick={() => openEditModal(p)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </Button>
                      {p.status !== "paid" && (
                        <Button
                          variant="success"
                          size="sm"
                          className="ml-2"
                          onClick={() => handleMarkAsPaid(p.id)}
                          disabled={markingPaidId === p.id}
                        >
                          {markingPaidId === p.id ? "Marking..." : "Mark as Paid"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
} 