import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, ShoppingBag, Clock } from 'lucide-react';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Production Started', 'Quality Check', 'Packing', 'Dispatched', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid', 'Refunded'];

export default function SalesOrders() {
  const { hasRole } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({ orderStatus: 'all', paymentStatus: 'all', search: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [form, setForm] = useState({
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    productName: '',
    quantity: '',
    unitPrice: '',
    totalAmount: 0,
    deliveryDate: '',
    orderStatus: 'Pending',
    paymentStatus: 'Pending',
    amountPaid: 0,
    notes: ''
  });

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => { fetchOrders(); }, [filters, pagination.page]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 10);
      if (filters.orderStatus !== 'all') params.append('orderStatus', filters.orderStatus);
      if (filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/sales?${params}`);
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
      orderNumber: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      productName: '',
      quantity: '',
      unitPrice: '',
      totalAmount: 0,
      deliveryDate: '',
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      amountPaid: 0,
      notes: ''
    });
    setEditingItem(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (item) => {
    setForm({
      orderNumber: item.orderNumber,
      customerName: item.customerName,
      customerEmail: item.customerEmail || '',
      customerPhone: item.customerPhone || '',
      productName: item.productName,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      totalAmount: item.totalAmount,
      deliveryDate: item.deliveryDate?.split('T')[0] || '',
      orderStatus: item.orderStatus,
      paymentStatus: item.paymentStatus,
      amountPaid: item.amountPaid || 0,
      notes: item.notes || ''
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
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        totalAmount: Number(form.quantity) * Number(form.unitPrice),
        amountPaid: Number(form.amountPaid)
      };

      if (editingItem) {
        await api.put(`/sales/${editingItem._id}`, data);
      } else {
        await api.post('/sales', data);
      }
      await fetchOrders();
      setModalOpen(false);
      resetForm();
    } catch (err) { alert(err.response?.data?.message || 'Error saving order'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/sales/${id}`);
      await fetchOrders();
      setDeleteConfirm(null);
    } catch (err) { alert(err.response?.data?.message || 'Error deleting order'); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-amber-100 text-amber-700',
      'Confirmed': 'bg-blue-100 text-blue-700',
      'Production Started': 'bg-violet-100 text-violet-700',
      'Quality Check': 'bg-orange-100 text-orange-700',
      'Packing': 'bg-teal-100 text-teal-700',
      'Dispatched': 'bg-indigo-100 text-indigo-700',
      'Delivered': 'bg-emerald-100 text-emerald-700',
      'Cancelled': 'bg-gray-100 text-gray-700'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    const styles = {
      'Pending': 'bg-amber-100 text-amber-700',
      'Partial': 'bg-blue-100 text-blue-700',
      'Paid': 'bg-emerald-100 text-emerald-700',
      'Refunded': 'bg-red-100 text-red-700'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  const columns = [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'customerName', label: 'Customer' },
    { key: 'productName', label: 'Product' },
    { key: 'quantity', label: 'Qty' },
    { key: 'totalAmount', label: 'Total', render: (val) => `$${val?.toLocaleString() || 0}` },
    { key: 'deliveryDate', label: 'Delivery', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
    { key: 'orderStatus', label: 'Status', render: (val) => getStatusBadge(val) },
    { key: 'paymentStatus', label: 'Payment', render: (val) => getPaymentBadge(val) },
  ];

  if (loading) return <div className="text-center py-20 text-gray-500">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Manage customer orders and production tracking</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Order
          </button>
        )}
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {ORDER_STATUSES.map(status => {
          const count = orders.filter(o => o.orderStatus === status).length;
          const colors = {
            'Pending': 'bg-amber-50 border-amber-200 text-amber-700',
            'Confirmed': 'bg-blue-50 border-blue-200 text-blue-700',
            'Production Started': 'bg-violet-50 border-violet-200 text-violet-700',
            'Quality Check': 'bg-orange-50 border-orange-200 text-orange-700',
            'Packing': 'bg-teal-50 border-teal-200 text-teal-700',
            'Dispatched': 'bg-indigo-50 border-indigo-200 text-indigo-700',
            'Delivered': 'bg-emerald-50 border-emerald-200 text-emerald-700',
            'Cancelled': 'bg-gray-50 border-gray-200 text-gray-700'
          };
          return (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, orderStatus: filters.orderStatus === status ? 'all' : status })}
              className={`card border p-3 text-left transition-all ${filters.orderStatus === status ? 'ring-2 ring-textile-500' : ''} ${colors[status]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{status}</span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search orders..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-textile-500 outline-none"
          />
        </div>
        <select
          value={filters.paymentStatus}
          onChange={e => setFilters({ ...filters, paymentStatus: e.target.value })}
          className="input-field w-40"
        >
          <option value="all">All Payments</option>
          {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchOrders} className="btn-secondary">Search</button>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        searchKeys={['orderNumber', 'customerName', 'productName']}
        actions={canEdit ? (item) => (
          <div className="flex items-center gap-2">
            <button onClick={() => setViewModal(item)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"><Clock size={16} /></button>
            <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Pencil size={16} /></button>
            <button onClick={() => setDeleteConfirm(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
          </div>
        ) : null}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {orders.length} of {pagination.total} records</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button>
            <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* View Order Modal with Timeline */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title={`Order ${viewModal?.orderNumber}`} size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Customer</p><p className="font-medium">{viewModal.customerName}</p></div>
              <div><p className="text-sm text-gray-500">Product</p><p className="font-medium">{viewModal.productName}</p></div>
              <div><p className="text-sm text-gray-500">Total</p><p className="font-medium">${viewModal.totalAmount?.toLocaleString()}</p></div>
              <div><p className="text-sm text-gray-500">Delivery</p><p className="font-medium">{viewModal.deliveryDate ? new Date(viewModal.deliveryDate).toLocaleDateString() : '-'}</p></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Timeline</h4>
              <div className="space-y-3">
                {viewModal.timeline?.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-textile-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{event.status}</p>
                      <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                      {event.note && <p className="text-xs text-gray-600 mt-1">{event.note}</p>}
                    </div>
                  </div>
                )) || <p className="text-sm text-gray-400">No timeline events</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingItem ? 'Edit Order' : 'Add Order'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
              <input type="text" value={form.orderNumber} onChange={e => setForm({...form, orderNumber: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select value={form.orderStatus} onChange={e => setForm({...form, orderStatus: e.target.value})} className="input-field">
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input type="text" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input type="email" value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input type="tel" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input type="text" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} className="input-field" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input-field" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
              <input type="number" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} className="input-field" required min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
              <input type="text" value={`$${(Number(form.quantity || 0) * Number(form.unitPrice || 0)).toLocaleString()}`} className="input-field bg-gray-50" readOnly />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input type="date" value={form.deliveryDate} onChange={e => setForm({...form, deliveryDate: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})} className="input-field">
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid ($)</label>
            <input type="number" value={form.amountPaid} onChange={e => setForm({...form, amountPaid: e.target.value})} className="input-field" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" placeholder="Additional details..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={formLoading} className="btn-primary">{formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add')} Order</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-600">Delete order <strong>{deleteConfirm?.orderNumber}</strong>?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}