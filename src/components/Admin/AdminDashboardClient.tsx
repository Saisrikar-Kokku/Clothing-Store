'use client';

import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import Button from "@/components/UI/Button";
import {
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Package,
  Plus,
  FileText,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Calendar,
  Phone,
} from "lucide-react";
import AnalyticsDashboard from "@/components/Admin/AnalyticsDashboard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Add types for dashboard data
type DashboardData = {
  totalItems: number;
  lowStockItems: number;
  totalSuppliers: number;
  supplierDues: number;
  pendingPayments: number;
  totalPendingAmount: number;
  recentSales: { id: string; item: string; amount: number; date: string }[];
  lowStockAlerts: { id: string; name: string; quantity: number; category: string; cost_price: number; selling_price: number }[];
  supplierAlerts: { id: string; name: string; amount: number; dueDate: string; phone: string }[];
  pendingPaymentAlerts: PendingPaymentAlert[];
};

type PendingPaymentAlert = { id: string; customer: string; amount: number; dueDate: string; items: string[]; phone: string; status: string; };
type InventoryRecord = { id: string; name: string; category: string; description: string; cost_price: number; selling_price: number; quantity: number; image_url?: string; created_at: string; user_id?: string; };
type SupplierRecord = { id: string; name: string; amount_due: number; due_date: string; phone?: string; };
type SaleRecord = { id: string; item_id: string; item_name: string; quantity_sold: number; selling_price: number; total_revenue: number; sale_date: string; created_at: string; };

const initialData: DashboardData = {
  totalItems: 0,
  lowStockItems: 0,
  totalSuppliers: 0,
  supplierDues: 0,
  pendingPayments: 0,
  totalPendingAmount: 0,
  recentSales: [],
  lowStockAlerts: [],
  supplierAlerts: [],
  pendingPaymentAlerts: [],
};

export default function AdminDashboardClient() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData>(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const fetchData = async () => {
    try {
      let inventoryData: InventoryRecord[] = [];
      let suppliersData: SupplierRecord[] = [];
      let salesData: SaleRecord[] = [];
      let pendingPaymentsRaw: Record<string, unknown>[] = [];

      // Fetch inventory data
      const { data: inv, error: invErr } = await supabase.from('inventory').select('*');
      if (!invErr && inv) inventoryData = inv;

      // Fetch suppliers data
      const { data: sup, error: supErr } = await supabase.from('suppliers').select('*');
      if (!supErr && sup) suppliersData = sup;

      // Fetch sales data
      const { data: sales, error: salesErr } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(5);
      if (!salesErr && sales) salesData = sales;

      // Fetch pending payments data (if you have a table)
      const { data: pending, error: pendingErr } = await supabase.from('pending_payments').select('*');
      if (!pendingErr && pending) pendingPaymentsRaw = pending;
      // Only show payments that are not paid
      const pendingPaymentsData = pendingPaymentsRaw.filter((p) => p.status !== 'paid');

      setData({
        totalItems: inventoryData.length,
        lowStockItems: inventoryData.filter(item => item.quantity <= 5).length,
        totalSuppliers: suppliersData.length,
        supplierDues: suppliersData.reduce((sum, supplier) => sum + (supplier.amount_due || 0), 0),
        pendingPayments: pendingPaymentsData.length,
        totalPendingAmount: pendingPaymentsData.reduce((sum, p) => {
          const pay = p as Record<string, unknown>;
          return sum + Number(pay.amount_due || pay.amount || 0);
        }, 0),
        recentSales: salesData.map(sale => ({
          id: String(sale.id),
          item: String(sale.item_name),
          amount: Number(sale.total_revenue),
          date: String(sale.sale_date)
        })),
        lowStockAlerts: inventoryData.filter(item => item.quantity <= 5).map(item => ({
          id: String(item.id),
          name: String(item.name),
          quantity: Number(item.quantity),
          category: String(item.category),
          cost_price: Number(item.cost_price),
          selling_price: Number(item.selling_price)
        })),
        supplierAlerts: suppliersData.filter(supplier => supplier.amount_due > 0).map(supplier => ({
          id: String(supplier.id),
          name: String(supplier.name),
          amount: Number(supplier.amount_due),
          dueDate: String(supplier.due_date),
          phone: supplier.phone ? String(supplier.phone) : ""
        })),
        pendingPaymentAlerts: pendingPaymentsData.map(payment => {
          const pay = payment as Record<string, unknown>;
          return {
            id: String(pay.id),
            customer: String(pay.name || pay.customer_name || ""),
            amount: Number(pay.amount || pay.amount_due || 0),
            dueDate: String(pay.due_date),
            items: Array.isArray(pay.items) ? (pay.items as unknown[]).map(String) : [],
            phone: pay.phone ? String(pay.phone) : "",
            status: pay.status ? String(pay.status) : "pending"
          };
        }),
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set all data to empty/zero if there's an error
      setData(initialData);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Listen for storage events to refresh data when inventory changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inventory-updated') {
        console.log('Inventory updated, refreshing dashboard...');
        setIsRefreshing(true);
        fetchData().then(() => {
          setIsRefreshing(false);
          // Show a brief notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
          notification.textContent = 'Dashboard updated with latest inventory data!';
          document.body.appendChild(notification);
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
        });
      }
    };

    // Listen for custom events
    const handleInventoryUpdate = () => {
      console.log('Inventory update event received, refreshing dashboard...');
      setIsRefreshing(true);
      fetchData().then(() => {
        setIsRefreshing(false);
        // Show a brief notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Dashboard updated with latest inventory data!';
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      });
    };

    // Listen for dashboard-data-updated events
    const handleDashboardUpdate = () => {
      fetchData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('inventory-updated', handleInventoryUpdate);
    window.addEventListener('dashboard-data-updated', handleDashboardUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inventory-updated', handleInventoryUpdate);
      window.removeEventListener('dashboard-data-updated', handleDashboardUpdate);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const quickActions = [
    {
      title: "Add New Item",
      description: "Add a new product to inventory",
      icon: Plus,
      href: "/admin/inventory",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "View Sales Report",
      description: "Check today's sales and reports",
      icon: FileText,
      href: "/admin/sales",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Manage Suppliers",
      description: "Update supplier information",
      icon: Users,
      href: "/admin/suppliers",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Pending Payments",
      description: "Track customer payments",
      icon: DollarSign,
      href: "/admin/pending-payments",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Quick Actions */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here&apos;s your store overview.</p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <div className="relative group">
              <Button variant="outline" className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>Help</span>
              </Button>
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Quick Tips:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Click on any card to see more details</li>
                    <li>• Use Quick Actions for common tasks</li>
                    <li>• Red alerts need immediate attention</li>
                    <li>• Yellow alerts are due soon</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-center p-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-600 transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalItems}</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{data.lowStockItems}</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Supplier Dues</p>
              <p className="text-2xl font-bold text-yellow-600">₹{data.supplierDues}</p>
            </div>
          </div>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-orange-600">₹{data.totalPendingAmount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Section (Client Component) */}
      <AnalyticsDashboard />

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Low Stock Alerts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            </div>
            <Link href="/admin/inventory">
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {data.lowStockAlerts.map((item: { id: string; name: string; quantity: number; category: string; cost_price: number; selling_price: number }) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600 font-semibold">{item.quantity} left</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Supplier Dues */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Supplier Dues</h3>
            </div>
            <Link href="/admin/suppliers">
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {data.supplierAlerts.map((supplier: { id: string; name: string; amount: number; dueDate: string; phone: string }) => (
              <div key={supplier.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{supplier.name}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {supplier.dueDate}
                    </span>
                    <span className="flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {supplier.phone}
                    </span>
                  </div>
                </div>
                <span className="text-yellow-600 font-semibold">₹{supplier.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending Payments */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Pending Customer Payments</h3>
          </div>
          <Link href="/admin/pending-payments">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm sm:rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.pendingPaymentAlerts.map((payment: PendingPaymentAlert) => (
                <tr
                  key={payment.id}
                  className={`hover:bg-gray-50 transition-colors ${payment.status === 'overdue' ? 'bg-red-50' : ''}`}
                >
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 flex items-center">
                      {payment.status === 'overdue' && (
                        <span className="mr-1" title="Overdue">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                      {payment.customer}
                    </div>
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4">
                    <div className="text-gray-900">{payment.items && payment.items.length > 0 ? payment.items.join(", ") : "-"}</div>
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="font-semibold text-orange-600">₹{payment.amount}</div>
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="text-gray-900">{payment.dueDate}</div>
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      <span className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-gray-900">{payment.phone}</span>
                      </span>
                      {payment.phone && (
                        <a
                          href={`tel:${payment.phone}`}
                          className="inline-flex items-center px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-semibold shadow focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                          title="Call Customer"
                        >
                          <Phone className="w-3 h-3 mr-1" />Call
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                    <span title={payment.status === 'overdue' ? 'Payment is overdue' : 'Payment is pending'}>
                      <Badge variant={payment.status === 'overdue' ? 'danger' : 'warning'}>
                        {payment.status === 'overdue' ? (
                          <span className="flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</span>
                        ) : (
                          'Pending'
                        )}
                      </Badge>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Current Inventory */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ShoppingBag className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Current Inventory</h3>
          </div>
          <Link href="/admin/inventory">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <span>Manage Inventory</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.lowStockAlerts.length > 0 ? (
                data.lowStockAlerts.map((item: { id: string; name: string; quantity: number; category: string; cost_price: number; selling_price: number }) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{item.cost_price || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{item.selling_price || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="danger">Low Stock</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No inventory data found. Add some items to your inventory table in Supabase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Sales */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
          </div>
          <Link href="/admin/sales">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {data.recentSales.map((sale: { id: string; item: string; amount: number; date: string }) => (
            <div key={sale.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div>
                <p className="font-medium text-gray-900">{sale.item}</p>
                <p className="text-sm text-gray-600">{sale.date}</p>
              </div>
              <span className="text-green-600 font-semibold">₹{sale.amount}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 