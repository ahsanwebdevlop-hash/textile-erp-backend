import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Factory, ChevronRight } from 'lucide-react';

const STATUSES = ['Pending', 'In Production', 'Completed'];
const PROCESS_STAGES = [
  'Spinning',
  'Weaving/Knitting',
  'Dyeing/Finishing',
  'Cutting',
  'Sewing Line',
  'Packing & Export'
];

export default function Production() {
  const { hasRole } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ 
    orderId: '', 
    customerName: '', 
    productName: '', 
    quantity: '', 
    processStage: 'Spinning',
    targetGSM: 200,
    shadeCode: 'Dyeing Lot #1',
    lineEfficiency: 85,
    startDate: '', 
    completionDate: '', 
    status: 'Pending' 
  });

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { const res = await api.get('/production'); setOrders(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => { 
    setForm({ 
      orderId: '', 
      customerName: '', 
      productName: '', 
      quantity: '', 
      processStage: 'Spinning',
      targetGSM: 200,
      shadeCode: 'Dyeing Lot #1',
      lineEfficiency: 85,
      startDate: '', 
      completionDate: '', 
      status: 'Pending' 
    }); 
    setEditingOrder(null); 
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (order) => {
    setForm({ 
      orderId: order.orderId, 
      customerName: order.customerName, 
      productName: order.productName, 
      quantity: String(order.quantity), 
      processStage: order.processStage || 'Spinning',
      targetGSM: order.targetGSM || 200,
      shadeCode: order.shadeCode || 'Dyeing Lot #1',
      lineEfficiency: order.lineEfficiency || 85,
      startDate: order.startDate?.split('T')[0] || '', 
      completionDate: order.completionDate?.split('T')[0] || '', 
      status: order.status 
    });
    setEditingOrder(order); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      const data = { ...form, quantity: Number(form.quantity), targetGSM: Number(form.targetGSM), lineEfficiency: Number(form.lineEfficiency) };
      if (editingOrder) { await api.put(`/production/${editingOrder._id}`, data); }
      else { await api.post('/production', data); }
      await fetchOrders(); setModalOpen(false); resetForm();
    } catch (err) { alert(err.response?.data?.message || 'Error saving order'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/production/${id}`); await fetchOrders(); setDeleteConfirm(null); }
    catch (err) { alert(err.response?.data?.message || 'Error deleting order'); }
  };

  const getStatusBadge = (status) => {
    const styles = { 'Pending': 'bg-amber-100 text-amber-700', 'In Production': 'bg-blue-100 text-blue-700', 'Completed': 'bg-emerald-100 text-emerald-700' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  const columns = [
    { key: 'orderId', label: 'Order ID' },
    { key: 'customerName', label: 'Customer' },
    { key: 'productName', label: 'Product' },
    { key: 'processStage', label: 'Mill Process Stage', render: (val) => <span className="font-bold text-textile-700 bg-textile-50 px-2 py-1 rounded text-xs">{val || 'Spinning'}</span> },
    { key: 'quantity', label: 'Qty (pcs)' },
    { key: 'startDate', label: 'Start Date', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
    { key: 'completionDate', label: 'Expected Date', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (val) => getStatusBadge(val) },
  ];

  if (loading) return <div className="text-center py-20 text-gray-500">Loading production orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Multi-Stage Mill Production</h2>
          <p className="text-sm text-gray-500 mt-1">Spinning → Weaving/Knitting → Dyeing/Finishing → Cutting → Sewing → Packing</p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary"><Plus size={18} /> New Production Order</button>}
      </div>

      {/* Visual Mill Process Pipeline */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Live Mill Process Pipeline</h3>
        <div className="flex items-center gap-2 min-w-max">
          {PROCESS_STAGES.map((stage, idx) => {
            const count = orders.filter(o => (o.processStage || 'Spinning') === stage).length;
            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-center min-w-[130px]">
                  <p className="text-xs font-bold text-gray-800">{stage}</p>
                  <span className="text-xs text-textile-600 font-semibold">{count} Active Orders</span>
                </div>
                {idx < PROCESS_STAGES.length - 1 && <ChevronRight size={16} className="text-gray-400" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATUSES.map(status => {
          const count = orders.filter(o => o.status === status).length;
          const colors = { 'Pending': 'bg-amber-50 border-amber-200 text-amber-700', 'In Production': 'bg-blue-50 border-blue-200 text-blue-700', 'Completed': 'bg-emerald-50 border-emerald-200 text-emerald-700' };
          return (
            <div key={status} className={`card border ${colors[status]}`}>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium opacity-80">{status}</p><p className="text-2xl font-bold">{count}</p></div>
                <Factory size={24} className="opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      <DataTable columns={columns} data={orders} searchKeys={['orderId', 'customerName', 'productName', 'status', 'processStage']}
        actions={canEdit ? (row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
            <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
          </>
        ) : null} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingOrder ? 'Edit Production Order' : 'New Production Order'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
              <input type="text" value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })} className="input-field" placeholder="ORD-XXX" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Process Stage</label>
              <select value={form.processStage} onChange={e => setForm({ ...form, processStage: e.target.value })} className="input-field">
                {PROCESS_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="input-field" placeholder="Customer name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input type="text" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className="input-field" placeholder="Product name" required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input-field" placeholder="0" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target GSM</label>
              <input type="number" value={form.targetGSM} onChange={e => setForm({ ...form, targetGSM: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line Eff. (%)</label>
              <input type="number" value={form.lineEfficiency} onChange={e => setForm({ ...form, lineEfficiency: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
              <input type="date" value={form.completionDate} onChange={e => setForm({ ...form, completionDate: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : (editingOrder ? 'Update' : 'Create')} Order</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="text-red-500" size={24} /></div>
          <p className="text-gray-600 mb-6">Delete order <strong>{deleteConfirm?.orderId}</strong>?</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
