import { useState, useEffect } from 'react';
import api from '../utils/api.js';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Package, Factory, CheckCircle, Users, Download, ShoppingBag, ShoppingCart, DollarSign } from 'lucide-react';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
  const [data, setData] = useState({
    inventory: [], production: [], employees: [], sales: [],
    purchases: [], transactions: []
  });
  const [stats, setStats] = useState({ sales: null, purchases: null, accounts: null });
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [invRes, prodRes, empRes, salesRes, purchaseRes, txnRes, salesStats, purchaseStats, accountsRes] = await Promise.all([
        api.get('/inventory'), api.get('/production'), api.get('/employees'),
        api.get('/sales'), api.get('/purchases'), api.get('/transactions'),
        api.get('/sales/stats'), api.get('/purchases/stats'), api.get('/transactions/summary')
      ]);
      setData({
        inventory: invRes.data.data, production: prodRes.data.data, employees: empRes.data.data,
        sales: salesRes.data.data, purchases: purchaseRes.data.data, transactions: txnRes.data.data
      });
      setStats({ sales: salesStats.data.data, purchases: purchaseStats.data.data, accounts: accountsRes.data.data });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let rows = [];

    if (reportType === 'overview') {
      csvContent += "Metric,Value\n";
      rows = [
        `Total Sales,$${stats.sales?.totalRevenue || 0}`,
        `Total Purchases,$${stats.purchases?.totalAmount || 0}`,
        `Total Expenses,$${stats.accounts?.totalExpense || 0}`,
        `Net Profit,$${stats.accounts?.profit || 0}`,
        `Total Employees,${data.employees.length}`,
        `Total Suppliers,${[...new Set(data.purchases.map(p => p.supplier))].length}`,
        `Total Customers,${[...new Set(data.sales.map(s => s.customerName))].length}`
      ];
    } else if (reportType === 'sales') {
      csvContent += "Order Number,Customer,Product,Quantity,Total,Status,Delivery Date\n";
      rows = data.sales.map(s => `${s.orderNumber},${s.customerName},${s.productName},${s.quantity},${s.totalAmount},${s.orderStatus},${s.deliveryDate ? new Date(s.deliveryDate).toLocaleDateString() : '-'}`);
    } else if (reportType === 'purchases') {
      csvContent += "PO Number,Supplier,Items,Total,Status,Date\n";
      rows = data.purchases.map(p => `${p.purchaseNumber},${p.supplier},${p.items?.length || 0},${p.totalAmount},${p.status},${p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '-'}`);
    } else if (reportType === 'transactions') {
      csvContent += "Date,Title,Type,Category,Amount,Payment Method\n";
      rows = data.transactions.map(t => `${new Date(t.date).toLocaleDateString()},${t.title},${t.type},${t.category},${t.amount},${t.paymentMethod || 'Cash'}`);
    }

    csvContent += rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `textileflow_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalStock = data.inventory.reduce((sum, item) => sum + Number(item.quantity), 0);
  const completedOrders = data.production.filter(o => o.status === 'Completed').length;
  const totalProductionQty = data.production.reduce((sum, o) => sum + Number(o.quantity), 0);

  const categoryData = Object.entries(data.inventory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.quantity);
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const statusData = stats.sales?.statusStats?.map(s => ({ name: s._id, value: s.count })) || [];
  const deptData = Object.entries(data.employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const monthlyFinancial = stats.accounts?.monthlySummary?.slice(0, 6).reverse() || [];

  const completedOrdersList = data.production.filter(o => o.status === 'Completed').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const orderColumns = [
    { key: 'orderId', label: 'Order ID' },
    { key: 'customerName', label: 'Customer' },
    { key: 'productName', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'completionDate', label: 'Completed Date', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
  ];

  if (loading) return <div className="text-center py-20 text-gray-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Comprehensive business intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={reportType} onChange={e => setReportType(e.target.value)} className="input-field w-40">
            <option value="overview">Overview</option>
            <option value="sales">Sales</option>
            <option value="purchases">Purchases</option>
            <option value="transactions">Transactions</option>
          </select>
          <button onClick={exportToCSV} className="btn-secondary"><Download size={18} /> Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Stock" value={`${totalStock.toLocaleString()}`} icon={Package} color="blue" />
        <StatCard title="Total Production" value={`${totalProductionQty.toLocaleString()}`} icon={Factory} color="teal" />
        <StatCard title="Completed Orders" value={completedOrders} icon={CheckCircle} color="green" />
        <StatCard title="Active Workforce" value={data.employees.length} icon={Users} color="violet" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={`$${(stats.sales?.totalRevenue || 0).toLocaleString()}`} icon={ShoppingBag} color="emerald" />
        <StatCard title="Total Purchases" value={`$${(stats.purchases?.totalAmount || 0).toLocaleString()}`} icon={ShoppingCart} color="blue" />
        <StatCard title="Net Profit" value={`$${(stats.accounts?.profit || 0).toLocaleString()}`} icon={DollarSign} color={stats.accounts?.profit >= 0 ? 'green' : 'rose'} />
        <StatCard title="Profit Margin" value={`${stats.accounts?.profitMargin || 0}%`} icon={DollarSign} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Stock by Category</h3>
          <p className="text-sm text-gray-500 mb-4">Material distribution</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {categoryData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Order Status</h3>
          <p className="text-sm text-gray-500 mb-4">Sales pipeline</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {statusData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Departments</h3>
          <p className="text-sm text-gray-500 mb-4">Employee distribution</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Financial Trend */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Financial Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyFinancial}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
              <Line type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Production Orders</h3>
        <DataTable columns={orderColumns} data={completedOrdersList} searchKeys={['orderId', 'customerName', 'productName']} pageSize={5} />
      </div>
    </div>
  );
}