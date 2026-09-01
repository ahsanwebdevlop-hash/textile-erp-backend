import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const TRANSACTION_TYPES = ['Income', 'Expense'];
const EXPENSE_CATEGORIES = ['Purchase', 'Salary', 'Electricity', 'Transport', 'Maintenance', 'Misc'];
const INCOME_CATEGORIES = ['Sales', 'Refund', 'Investment', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Online'];
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Accounts() {
  const { hasRole } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', category: 'all', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    type: 'Expense',
    category: 'Purchase',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    paymentMethod: 'Cash'
  });

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchMonthlyReport();
  }, [filters, pagination.page]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 10);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.data);
      setPagination({
        page: res.data.currentPage,
        totalPages: res.data.totalPages,
        total: res.data.total
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/transactions/summary');
      setSummary(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchMonthlyReport = async () => {
    try {
      const res = await api.get('/transactions/monthly-report');
      setMonthlyData(res.data.data);
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      amount: '',
      type: 'Expense',
      category: 'Purchase',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      paymentMethod: 'Cash'
    });
    setEditingItem(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (item) => {
    setForm({
      title: item.title,
      description: item.description || '',
      amount: String(item.amount),
      type: item.type,
      category: item.category,
      date: item.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      reference: item.reference || '',
      paymentMethod: item.paymentMethod || 'Cash'
    });
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setFormLoading(true);
  try {
    const data = { 
      ...form, 
      amount: Number(form.amount),
      date: new Date(form.date).toISOString() // Ensure ISO format
    };
    
    console.log('Sending transaction:', data); // DEBUG
    
    if (editingItem) {
      await api.put(`/transactions/${editingItem._id}`, data);
    } else {
      await api.post('/transactions', data);
    }
    await fetchTransactions();
    await fetchSummary();
    await fetchMonthlyReport();
    setModalOpen(false);
    resetForm();
  } catch (err) { 
    console.error('FULL ERROR OBJECT:', err); // DEBUG
    console.error('Response:', err.response); // DEBUG
    console.error('Response data:', err.response?.data); // DEBUG
    console.error('Request config:', err.config); // DEBUG
    
    const errorMsg = err.response?.data?.message 
      || err.response?.data?.errors?.map(e => e.msg).join(', ')
      || err.message 
      || 'Error saving transaction';
    
    alert(`Error: ${errorMsg}`); 
  }
  finally { setFormLoading(false); }
};

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      await fetchTransactions();
      await fetchSummary();
      await fetchMonthlyReport();
      setDeleteConfirm(null);
    } catch (err) { alert(err.response?.data?.message || 'Error deleting transaction'); }
  };

  const getTypeBadge = (type) => {
    const styles = { 'Income': 'bg-emerald-100 text-emerald-700', 'Expense': 'bg-red-100 text-red-700' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}>{type}</span>;
  };

  const formatCurrency = (val) => {
    if (!val) return '$0.00';
    return `$${Number(val).toFixed(2)}`;
  };

  const categoryData = summary?.categoryBreakdown?.map(c => ({
    name: `${c._id.category} (${c._id.type})`,
    value: c.total,
    type: c._id.type
  })) || [];

  const columns = [
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type', render: (val) => getTypeBadge(val) },
    { key: 'amount', label: 'Amount', render: (val, row) => (
      <span className={row.type === 'Income' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
        {formatCurrency(val)}
      </span>
    )},
    { key: 'paymentMethod', label: 'Method' },
    { key: 'reference', label: 'Reference' },
  ];

  if (loading) return <div className="text-center py-20 text-gray-500">Loading transactions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts & Finance</h2>
          <p className="text-sm text-gray-500 mt-1">Track income, expenses, and financial overview</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Transaction
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Total Income</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(summary?.totalIncome)}</p>
              <p className="text-xs text-emerald-600">{summary?.incomeCount || 0} transactions</p>
            </div>
            <TrendingUp className="text-emerald-400" size={32} />
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(summary?.totalExpense)}</p>
              <p className="text-xs text-red-600">{summary?.expenseCount || 0} transactions</p>
            </div>
            <TrendingDown className="text-red-400" size={32} />
          </div>
        </div>
        <div className={`card border ${summary?.profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${summary?.profit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>Net Profit</p>
              <p className={`text-2xl font-bold ${summary?.profit >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{formatCurrency(summary?.profit)}</p>
              <p className="text-xs text-gray-500">Margin: {summary?.profitMargin || 0}%</p>
            </div>
            <BarChart3 className={summary?.profit >= 0 ? 'text-blue-400' : 'text-amber-400'} size={32} />
          </div>
        </div>
        <div className="card bg-violet-50 border-violet-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600">Total Transactions</p>
              <p className="text-2xl font-bold text-violet-700">{(summary?.incomeCount || 0) + (summary?.expenseCount || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {categoryData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} className="input-field w-32">
          <option value="all">All Types</option>
          {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="input-field w-40">
          <option value="all">All Categories</option>
          {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].filter((v, i, a) => a.indexOf(v) === i).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="input-field w-40" placeholder="Start Date" />
        <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="input-field w-40" placeholder="End Date" />
        <button onClick={fetchTransactions} className="btn-secondary">Apply Filters</button>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        searchKeys={['title', 'category', 'reference']}
        actions={canEdit ? (item) => (
          <div className="flex items-center gap-2">
            <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Pencil size={16} /></button>
            <button onClick={() => setDeleteConfirm(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
          </div>
        ) : null}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {transactions.length} of {pagination.total} records</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button>
            <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Transaction' : 'Add Transaction'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" placeholder="e.g. Raw cotton purchase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value, category: e.target.value === 'Income' ? 'Sales' : 'Purchase'})} className="input-field">
                {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                {(form.type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="input-field">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" placeholder="Additional details..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input type="text" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} className="input-field" placeholder="Invoice #, PO #, etc." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={formLoading} className="btn-primary">{formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add')} Transaction</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-600">Delete transaction <strong>{deleteConfirm?.title}</strong>?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}