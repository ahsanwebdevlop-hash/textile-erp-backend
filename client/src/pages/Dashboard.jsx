import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import StatCard from '../components/StatCard';
import { Package, Factory, CheckCircle, Users, ShoppingCart, ShoppingBag, Truck, Wallet, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const { user } = useApp();
  const [data, setData] = useState({
    inventory: [], production: [], employees: [], suppliers: [],
    sales: [], purchases: [], transactions: []
  });
  const [stats, setStats] = useState({
    sales: null, purchases: null, accounts: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      const [
        invRes, prodRes, empRes, supRes,
        salesRes, purchaseRes, txnRes,
        salesStatsRes, purchaseStatsRes, accountsRes
      ] = await Promise.all([
        api.get('/inventory?page=1&limit=5'),
        api.get('/production?page=1&limit=5'),
        api.get('/employees?page=1&limit=5'),
        api.get('/suppliers?page=1&limit=5'),
        api.get('/sales?page=1&limit=5'),
        api.get('/purchases?page=1&limit=5'),
        api.get('/transactions?page=1&limit=5'),
        api.get('/sales/stats'),
        api.get('/purchases/stats'),
        api.get('/transactions/summary')
      ]);

      setData({
        inventory: invRes.data.data,
        production: prodRes.data.data,
        employees: empRes.data.data,
        suppliers: supRes.data.data,
        sales: salesRes.data.data,
        purchases: purchaseRes.data.data,
        transactions: txnRes.data.data
      });

      setStats({
        sales: salesStatsRes.data.data,
        purchases: purchaseStatsRes.data.data,
        accounts: accountsRes.data.data
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const totalStock = data.inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const activeOrders = data.production.filter(o => o.status === 'In Production').length;
  const pendingSales = data.sales.filter(s => s.orderStatus === 'Pending').length;
  const pendingPurchases = data.purchases.filter(p => p.status === 'Pending' || p.status === 'Draft').length;
  const totalSales = stats.sales?.totalRevenue || data.sales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
  const totalPurchases = stats.purchases?.totalAmount || data.purchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
  const totalExpenses = stats.accounts?.totalExpense || 0;
  const netProfit = stats.accounts?.profit || (totalSales - totalExpenses);
  const totalCustomers = [...new Set(data.sales.map(s => s.customerName))].length;

  const orderStatusData = stats.sales?.statusStats?.map(s => ({ name: s._id, value: s.count })) || [];
  const purchaseStatusData = stats.purchases?.statusStats?.map(s => ({ name: s._id, value: s.count })) || [];
  const monthlyData = stats.accounts?.monthlySummary?.slice(0, 6).reverse() || [];

  const topCustomers = stats.sales?.topCustomers?.map(c => ({
    name: c._id,
    orders: c.totalOrders,
    spent: c.totalSpent
  })) || [];

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-amber-100 text-amber-700',
      'In Production': 'bg-blue-100 text-blue-700',
      'Completed': 'bg-emerald-100 text-emerald-700',
      'Delivered': 'bg-emerald-100 text-emerald-700',
      'Draft': 'bg-gray-100 text-gray-700',
      'Approved': 'bg-blue-100 text-blue-700',
      'Received': 'bg-emerald-100 text-emerald-700'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={`$${totalSales.toLocaleString()}`} icon={ShoppingBag} color="emerald" trend="up" trendValue="+12%" />
        <StatCard title="Total Purchases" value={`$${totalPurchases.toLocaleString()}`} icon={ShoppingCart} color="blue" trend="up" trendValue="+8%" />
        <StatCard title="Total Expenses" value={`$${totalExpenses.toLocaleString()}`} icon={TrendingDown} color="rose" trend="down" trendValue="-3%" />
        <StatCard title="Net Profit" value={`$${netProfit.toLocaleString()}`} icon={DollarSign} color={netProfit >= 0 ? 'green' : 'rose'} />
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Suppliers" value={data.suppliers.length} icon={Truck} color="violet" />
        <StatCard title="Total Customers" value={totalCustomers} icon={Users} color="teal" />
        <StatCard title="Pending Orders" value={pendingSales} icon={Clock} color="amber" />
        <StatCard title="Pending Purchases" value={pendingPurchases} icon={Package} color="orange" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Monthly Income vs Expenses</h3>
          <p className="text-sm text-gray-500 mb-4">Financial performance over time</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sales Order Status</h3>
          <p className="text-sm text-gray-500 mb-4">Current order distribution</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {orderStatusData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Purchase Status</h3>
          <p className="text-sm text-gray-500 mb-4">Purchase order pipeline</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={purchaseStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {purchaseStatusData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Top Customers</h3>
          <p className="text-sm text-gray-500 mb-4">By total spending</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="spent" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.slice(0, 5).map(order => (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="py-3 text-sm text-gray-600">{order.customerName}</td>
                    <td className="py-3 text-sm text-gray-600">${order.totalAmount?.toLocaleString()}</td>
                    <td className="py-3">{getStatusBadge(order.orderStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchase Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">PO</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.purchases.slice(0, 5).map(po => (
                  <tr key={po._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 text-sm font-medium text-gray-900">{po.purchaseNumber}</td>
                    <td className="py-3 text-sm text-gray-600">{po.supplier}</td>
                    <td className="py-3 text-sm text-gray-600">${po.totalAmount?.toLocaleString()}</td>
                    <td className="py-3">{getStatusBadge(po.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}