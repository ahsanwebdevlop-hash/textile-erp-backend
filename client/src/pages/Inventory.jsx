import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const UNITS = ['KG', 'Meter', 'Pieces', 'Roll', 'Box'];
const CATEGORIES = ['Cotton', 'Polyester', 'Silk', 'Denim', 'Wool', 'Linen', 'Nylon', 'Other'];

export default function Inventory() {
  const { hasRole } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ materialName: '', category: 'Cotton', quantity: '', unit: 'Meter', supplier: '', purchaseDate: '' });

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get('/inventory'); setItems(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ materialName: '', category: 'Cotton', quantity: '', unit: 'Meter', supplier: '', purchaseDate: '' }); setEditingItem(null); };
  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (item) => {
    setForm({ materialName: item.materialName, category: item.category, quantity: String(item.quantity), unit: item.unit, supplier: item.supplier, purchaseDate: item.purchaseDate?.split('T')[0] || '' });
    setEditingItem(item); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      const data = { ...form, quantity: Number(form.quantity) };
      if (editingItem) { await api.put(`/inventory/${editingItem._id}`, data); }
      else { await api.post('/inventory', data); }
      await fetchItems(); setModalOpen(false); resetForm();
    } catch (err) { alert(err.response?.data?.message || 'Error saving item'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/inventory/${id}`); await fetchItems(); setDeleteConfirm(null); }
    catch (err) { alert(err.response?.data?.message || 'Error deleting item'); }
  };

  const columns = [
    { key: 'materialName', label: 'Material Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'purchaseDate', label: 'Purchase Date', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
  ];

  if (loading) return <div className="text-center py-20 text-gray-500">Loading inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your fabric and material stock</p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary"><Plus size={18} /> Add Material</button>}
      </div>
      <DataTable columns={columns} data={items} searchKeys={['materialName', 'category', 'supplier']}
        actions={canEdit ? (row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
            <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
          </>
        ) : null} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingItem ? 'Edit Material' : 'Add New Material'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
            <input type="text" value={form.materialName} onChange={e => setForm({ ...form, materialName: e.target.value })} className="input-field" placeholder="e.g. Cotton Fabric - White" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="input-field">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="input-field" placeholder="0" required min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="input-field" placeholder="Supplier name" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add')} Material</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="text-red-500" size={24} /></div>
          <p className="text-gray-600 mb-6">Delete <strong>{deleteConfirm?.materialName}</strong>?</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
