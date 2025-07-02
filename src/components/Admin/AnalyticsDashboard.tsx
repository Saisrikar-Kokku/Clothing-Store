'use client';

import Card from "@/components/UI/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ShoppingBag, TrendingUp, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnalyticsDashboard() {
  const [monthlySales, setMonthlySales] = useState<{ month: string; sales: number }[]>([]);
  const [mostSoldItems, setMostSoldItems] = useState<{ name: string; value: number }[]>([]);
  const [inventoryWorth, setInventoryWorth] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      // Fetch sales data
      const { data: sales, error: salesError } = await supabase.from("sales").select("id, item_id, item_name, quantity_sold, selling_price, total_revenue, sale_date");
      // Fetch inventory data
      const { data: inventory, error: inventoryError } = await supabase.from("inventory").select("id, category, cost_price, quantity");
      if (salesError || inventoryError) {
        setMonthlySales([]);
        setMostSoldItems([]);
        setInventoryWorth(0);
        setTodaySales(0);
        setMonthlyGrowth(0);
        setAvgOrderValue(0);
        setTotalProfit(0);
        setLoading(false);
        return;
      }
      // Monthly sales (last 6 months)
      const salesByMonth: { [key: string]: number } = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short' });
        salesByMonth[key] = 0;
      }
      sales?.forEach((sale) => {
        const date = new Date(sale.sale_date);
        const key = date.toLocaleString('default', { month: 'short' });
        if (key in salesByMonth) {
          salesByMonth[key] += sale.total_revenue;
        }
      });
      setMonthlySales(Object.entries(salesByMonth).map(([month, sales]) => ({ month, sales })));
      // Most sold items (this month)
      const currentMonth = now.getMonth();
      const itemCount: { [name: string]: number } = {};
      sales?.forEach((sale) => {
        const date = new Date(sale.sale_date);
        if (date.getMonth() === currentMonth && date.getFullYear() === now.getFullYear()) {
          itemCount[sale.item_name] = (itemCount[sale.item_name] || 0) + sale.quantity_sold;
        }
      });
      setMostSoldItems(Object.entries(itemCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 4));
      // Inventory worth
      setInventoryWorth((inventory || []).reduce((sum, item) => sum + (item.cost_price * item.quantity), 0));
      // Today's sales
      const todayStr = now.toISOString().slice(0, 10);
      setTodaySales(sales?.filter(sale => sale.sale_date.slice(0, 10) === todayStr).reduce((sum, sale) => sum + sale.total_revenue, 0) || 0);
      // Monthly growth (compare this month to last month)
      const thisMonthSales = sales?.filter(sale => {
        const date = new Date(sale.sale_date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).reduce((sum, sale) => sum + sale.total_revenue, 0) || 0;
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthSales = sales?.filter(sale => {
        const date = new Date(sale.sale_date);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }).reduce((sum, sale) => sum + sale.total_revenue, 0) || 0;
      setMonthlyGrowth(lastMonthSales === 0 ? 0 : (((thisMonthSales - lastMonthSales) / lastMonthSales) * 100));
      // Average order value
      setAvgOrderValue(sales && sales.length > 0 ? (sales.reduce((sum, sale) => sum + sale.total_revenue, 0) / sales.length) : 0);
      // Profit Calculation
      let profit = 0;
      sales?.forEach((sale) => {
        const inv = inventory?.find((item) => item.id === sale.item_id);
        const cost = inv?.cost_price ?? 0;
        profit += (sale.selling_price - cost) * sale.quantity_sold;
      });
      setTotalProfit(profit);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="mb-8 p-4 text-center text-blue-600">Loading analytics...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Sales</h3>
            <div className="text-sm text-gray-600">Last 6 months</div>
          </div>
          {monthlySales.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No sales data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySales}>
                <XAxis dataKey="month" stroke="#1a202c" />
                <YAxis stroke="#1a202c" />
                <Tooltip 
                  formatter={(value: number) => [`₹${value}`, 'Sales']}
                  labelFormatter={(label) => `${label} 2024`}
                />
                <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Most Sold Items</h3>
            <div className="text-sm text-gray-600">This month</div>
          </div>
          {mostSoldItems.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No sales data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={mostSoldItems}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {mostSoldItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#2563eb", "#16a34a", "#f59e42", "#dc2626"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} units`, 'Sold']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
      
      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inventory Worth</p>
              <p className="text-2xl font-bold text-blue-600">₹{inventoryWorth.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today&apos;s Sales</p>
              <p className="text-2xl font-bold text-green-600">₹{todaySales}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
              <p className="text-2xl font-bold text-purple-600">{monthlyGrowth >= 0 ? "+" : "-"}{Math.abs(monthlyGrowth).toFixed(1)}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-orange-600">₹{avgOrderValue.toFixed(0)}</p>
            </div>
          </div>
        </Card>
      </div>
      {/* Profit Calculation */}
      <div className="mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-green-600">₹{totalProfit.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
} 