import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, ShoppingCart, Filter, ChevronDown } from 'lucide-react';

const PURCHASE_STATUSES = ['Draft', 'Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'];
const UNITS = ['KG', 'Meter', 'Pieces', 'Roll', 'Box'];

export default function Purchases() {
  const { hasRole } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  const [form, setForm] = useState({
    purchaseNumber: '',
    supplier: '',
    supplierId: '',
    items: [{ materialName: '', quantity: '', unit: 'KG', unitPrice: '', total: 0 }],
    subTotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    status: 'Draft',
    purchaseDate: '',
    expectedDeliveryDate: '',
    notes: ''
  });

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => { fetchOrders(); }, [filters, pagination.page]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 10);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const res = await api.get(`/purchases?${params}`);
      setOrders(res.data.data);
      setPagination({
        page: res.data.currentPage,
        totalPages: res.data.totalPages,
        total: res.data.total
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({
      purchaseNumber: '',
      supplier: '',
      supplierId: '',
      items: [{ materialName: '', quantity: '', unit: 'KG', unitPrice: '', total: 0 }],
      subTotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      status: 'Draft',
      purchaseDate: '',
      expectedDeliveryDate: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };
  
  const openEdit = (item) => {
    setForm({
      purchaseNumber: item.purchaseNumber,
      supplier: item.supplier,
      supplierId: item.supplierId || '',
      items: item.items.map(i => ({ ...i, quantity: String(i.quantity), unitPrice: String(i.unitPrice) })),
      subTotal: item.subTotal,
      tax: item.tax || 0,
      discount: item.discount || 0,
      totalAmount: item.totalAmount,
      status: item.status,
      purchaseDate: item.purchaseDate?.split('T')[0] || '',
      expectedDeliveryDate: item.expectedDeliveryDate?.split('T')[0] || '',
      notes: item.notes || ''
    });
    setEditingItem(item);
    setModalOpen(true);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { materialName: '', quantity: '', unit: 'KG', unitPrice: '', total: 0 }] });
  
  const removeItem = (idx) => {
    const newItems = form.items.filter((_, i) => i !== idx);
    recalculateTotals(newItems);
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...form.items];
    newItems[idx][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[idx].total = Number(newItems[idx].quantity || 0) * Number(newItems[idx].unitPrice || 0);
    }
    recalculateTotals(newItems);
  };

  const recalculateTotals = (items) => {
    const subTotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    const totalAmount = subTotal + Number(form.tax || 0) - Number(form.discount || 0);
    setForm({ ...form, items, subTotal, totalAmount: Math.max(0, totalAmount) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const data = {
        ...form,
        items: form.items.map(i => ({
          ...i,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          total: Number(i.total)
        })),
        subTotal: Number(form.subTotal),
        tax: Number(form.tax),
        discount: Number(form.discount),
        totalAmount: Number(form.totalAmount)
      };
      
      if (editingItem) {
        await api.put(`/purchases/${editingItem._id}`, data);
      } else {
        await api.post('/purchases', data);
      }
      await fetchOrders();
      setModalOpen(false);
      resetForm();
    } catch (err) { alert(err.response?.data?.message || 'Error saving purchase order'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/purchases/${id}`);
      await fetchOrders();
      setDeleteConfirm(null);
    } catch (err) { alert(err.response?.data?.message || 'Error deleting purchase order'); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-gray-100 text-gray-700',
      'Pending': 'bg-amber-100 text-amber-700',
      'Approved': 'bg-blue-100 text-blue-700',
      'Ordered': 'bg-violet-100 text-violet-700',
      'Received': 'bg-emerald-100 text-emerald-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  const columns = [
    { key: 'purchaseNumber', label: 'PO Number' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'items', label: 'Items', render: (val) => `${val?.length || 0} items` },
    { key: 'totalAmount', label: 'Total', render: (val) => `$${val?.toLocaleString() || 0}` },
    { key: 'purchaseDate', label: 'Date', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (val) => getStatusBadge(val) },
  ];

  if (loading) return <div className="text-center py-20 text-gray-500">Loading purchase orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage material purchases from suppliers</p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary"><Plus size={18} /> New Purchase</button>}
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PURCHASE_STATUSES.map(status => {
          const count = orders.filter(o => o.status === status).length;
          const colors = {
            'Draft': 'bg-gray-50 border-gray-200 text-gray-700',
            'Pending': 'bg-amber-50 border-amber-200 text-amber-700',
            'Approved': 'bg-blue-50 border-blue-200 text-blue-700',
            'Ordered': 'bg-violet-50 border-violet-200 text-violet-700',
            'Received': 'bg-emerald-50 border-emerald-200 text-emerald-700',
            'Cancelled': 'bg-red-50 border-red-200 text-red-700'
          };
          return (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status: filters.status === status ? 'all' : status })}
              className={`card border p-3 text-left transition-all ${filters.status === status ? 'ring-2 ring-textile-500' : ''} ${colors[status]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium opacity-80">{status}</span>
                <span className="text-xl font-bold">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search purchases..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-textile-500 outline-none"
          />
        </div>
        <button onClick={fetchOrders} className="btn-secondary">Search</button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchKeys={['purchaseNumber', 'supplier']}
        actions={canEdit ? (row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
            <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
          </>
        ) : null}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {orders.length} of {pagination.total} records</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >Previous</button>
            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingItem ? 'Edit Purchase Order' : 'New Purchase Order'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input type="text" value={form.purchaseNumber} onChange={e => setForm({ ...form, purchaseNumber: e.target.value })} className="input-field" placeholder="PO-001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                {PURCHASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="input-field" placeholder="Supplier name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
            <input type="date" value={form.expectedDeliveryDate} onChange={e => setForm({ ...form, expectedDeliveryDate: e.target.value })} className="input-field" />
          </div>

          {/* Items Section */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Items</h4>
              <button type="button" onClick={addItem} className="text-sm text-textile-600 hover:text-textile-700 font-medium">+ Add Item</button>
            </div>
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <input type="text" value={item.materialName} onChange={e => updateItem(idx, 'materialName', e.target.value)} className="input-field text-sm" placeholder="Material" required />
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="input-field text-sm" placeholder="Qty" required min="1" />
                </div>
                <div className="col-span-2">
                  <select value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="input-field text-sm">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} className="input-field text-sm" placeholder="Price" required min="0" />
                </div>
                <div className="col-span-2">
                  <input type="text" value={`$${item.total || 0}`} className="input-field text-sm bg-gray-50" readOnly />
                </div>
                <div className="col-span-1">
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax ($)</label>
              <input type="number" value={form.tax} onChange={e => { setForm({ ...form, tax: e.target.value }); recalculateTotals(form.items); }} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
              <input type="number" value={form.discount} onChange={e => { setForm({ ...form, discount: e.target.value }); recalculateTotals(form.items); }} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input type="text" value={`$${form.totalAmount.toLocaleString()}`} className="input-field bg-gray-50 font-bold" readOnly />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} placeholder="Additional notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Create')} Order</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="text-red-500" size={24} /></div>
          <p className="text-gray-600 mb-6">Delete PO <strong>{deleteConfirm?.purchaseNumber}</strong>?</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}