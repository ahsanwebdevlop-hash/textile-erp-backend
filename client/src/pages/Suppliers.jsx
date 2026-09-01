import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Truck, Eye, X, History, DollarSign } from 'lucide-react';

const PAYMENT_STATUSES = ['Paid', 'Pending', 'Overdue'];
const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 60', 'Cash on Delivery', 'Prepaid'];

export default function Suppliers() {
  const { hasRole } = useApp();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({ paymentStatus: 'all', isActive: 'all', search: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    materialType: '',
    paymentTerms: 'Net 30',
    paymentStatus: 'Pending',
    outstandingBalance: 0,
    isActive: true,
    notes: ''
  });

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => { fetchSuppliers(); }, [filters, pagination.page]);

  const fetchSuppliers = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', 10);
      if (filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      if (filters.isActive !== 'all') params.append('isActive', filters.isActive);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/suppliers?${params}`);
      setSuppliers(res.data.data);
      setPagination({
        page: res.data.currentPage,
        totalPages: res.data.totalPages,
        total: res.data.total
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPurchaseHistory = async (supplierId) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/suppliers/${supplierId}/purchase-history`);
      setPurchaseHistory(res.data.data);
    } catch (err) { console.error(err); }
    finally { setHistoryLoading(false); }
  };

  const resetForm = () => {
    setForm({
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      materialType: '',
      paymentTerms: 'Net 30',
      paymentStatus: 'Pending',
      outstandingBalance: 0,
      isActive: true,
      notes: ''
    });
    setEditingItem(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (item) => {
    setForm({
      companyName: item.companyName,
      contactPerson: item.contactPerson,
      phone: item.phone,
      email: item.email || '',
      address: item.address || '',
      city: item.city || '',
      country: item.country || '',
      materialType: item.materialType || '',
      paymentTerms: item.paymentTerms || 'Net 30',
      paymentStatus: item.paymentStatus,
      outstandingBalance: item.outstandingBalance || 0,
      isActive: item.isActive !== false,
      notes: item.notes || ''
    });
    setEditingItem(item);
    setModalOpen(true);
  };

  const openProfile = async (item) => {
    try {
      const res = await api.get(`/suppliers/${item._id}`);
      setProfileModal(res.data.data);
    } catch (err) { console.error(err); }
  };

  const openHistory = async (item) => {
    setHistoryModal(item);
    await fetchPurchaseHistory(item._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const data = { ...form, outstandingBalance: Number(form.outstandingBalance) };
      if (editingItem) {
        await api.put(`/suppliers/${editingItem._id}`, data);
      } else {
        await api.post('/suppliers', data);
      }
      await fetchSuppliers();
      setModalOpen(false);
      resetForm();
    } catch (err) { alert(err.response?.data?.message || 'Error saving supplier'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/suppliers/${id}`);
      await fetchSuppliers();
      setDeleteConfirm(null);
    } catch (err) { alert(err.response?.data?.message || 'Error deleting supplier'); }
  };

  const getPaymentBadge = (status) => {
    const styles = {
      'Paid': 'bg-emerald-100 text-emerald-700',
      'Pending': 'bg-amber-100 text-amber-700',
      'Overdue': 'bg-red-100 text-red-700'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  const getStatusBadge = (isActive) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const columns = [
    { key: 'companyName', label: 'Company' },
    { key: 'contactPerson', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'materialType', label: 'Material' },
    { key: 'paymentStatus', label: 'Payment', render: (val) => getPaymentBadge(val) },
    { key: 'isActive', label: 'Status', render: (val) => getStatusBadge(val) },
    { key: 'outstandingBalance', label: 'Balance', render: (val) => `$${Number(val || 0).toLocaleString()}` },
  ];

  if (loading) return <div className="text-center py-20 text-gray-500">Loading suppliers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage fabric and material suppliers</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Supplier
          </button>
        )}
      </div>

      {/* Payment Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {['all', ...PAYMENT_STATUSES].map(status => {
          const count = status === 'all' 
            ? suppliers.length 
            : suppliers.filter(s => s.paymentStatus === status).length;
          const colors = {
            'all': 'bg-gray-50 border-gray-200 text-gray-700',
            'Paid': 'bg-emerald-50 border-emerald-200 text-emerald-700',
            'Pending': 'bg-amber-50 border-amber-200 text-amber-700',
            'Overdue': 'bg-red-50 border-red-200 text-red-700'
          };
          return (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, paymentStatus: status })}
              className={`card border p-3 text-left transition-all ${filters.paymentStatus === status ? 'ring-2 ring-textile-500' : ''} ${colors[status]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium capitalize">{status === 'all' ? 'All' : status}</span>
                <span className="text-xl font-bold">{count}</span>
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
            placeholder="Search suppliers..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-textile-500 outline-none"
          />
        </div>
        <select
          value={filters.isActive}
          onChange={e => setFilters({ ...filters, isActive: e.target.value })}
          className="input-field w-36"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button onClick={fetchSuppliers} className="btn-secondary">Search</button>
      </div>

      <DataTable
        data={suppliers}
        columns={columns}
        searchKeys={['companyName', 'contactPerson', 'materialType']}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button onClick={() => openProfile(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="View Profile">
              <Eye size={16} />
            </button>
            <button onClick={() => openHistory(row)} className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md" title="Purchase History">
              <History size={16} />
            </button>
            {canEdit && (
              <>
                <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Pencil size={16} /></button>
                <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
              </>
            )}
          </div>
        )}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {suppliers.length} of {pagination.total} records</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button>
            <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <Modal isOpen={!!profileModal} onClose={() => setProfileModal(null)} title={profileModal?.companyName} size="lg">
        {profileModal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-gray-50">
                <p className="text-sm text-gray-500">Contact Person</p>
                <p className="font-medium text-gray-900">{profileModal.contactPerson}</p>
              </div>
              <div className="card bg-gray-50">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{profileModal.phone}</p>
              </div>
              <div className="card bg-gray-50">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{profileModal.email || '-'}</p>
              </div>
              <div className="card bg-gray-50">
                <p className="text-sm text-gray-500">Material Type</p>
                <p className="font-medium text-gray-900">{profileModal.materialType || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Address</p>
              <p className="text-sm text-gray-700">{profileModal.address || '-'}, {profileModal.city || '-'}, {profileModal.country || '-'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="card bg-emerald-50 border-emerald-200 text-center">
                <DollarSign className="mx-auto text-emerald-600 mb-1" size={20} />
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-lg font-bold text-emerald-700">${profileModal.totalSpent?.toLocaleString() || 0}</p>
              </div>
              <div className="card bg-blue-50 border-blue-200 text-center">
                <Truck className="mx-auto text-blue-600 mb-1" size={20} />
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-lg font-bold text-blue-700">{profileModal.totalPurchaseOrders || 0}</p>
              </div>
              <div className="card bg-amber-50 border-amber-200 text-center">
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className="text-lg font-bold text-amber-700">${profileModal.outstandingBalance?.toLocaleString() || 0}</p>
              </div>
            </div>
            {profileModal.purchaseHistory?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Purchases</h4>
                <div className="space-y-2">
                  {profileModal.purchaseHistory.slice(0, 5).map(po => (
                    <div key={po._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{po.purchaseNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(po.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900">${po.totalAmount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Purchase History Modal */}
      <Modal isOpen={!!historyModal} onClose={() => setHistoryModal(null)} title={`Purchase History - ${historyModal?.companyName}`} size="lg">
        {historyLoading ? (
          <div className="text-center py-10 text-gray-500">Loading history...</div>
        ) : purchaseHistory.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No purchase history found</div>
        ) : (
          <div className="space-y-3">
            {purchaseHistory.map(po => (
              <div key={po._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{po.purchaseNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(po.purchaseDate).toLocaleDateString()} • {po.items?.length || 0} items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">${po.totalAmount?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    po.status === 'Received' ? 'bg-emerald-100 text-emerald-700' :
                    po.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{po.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingItem ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" required value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input type="text" required value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
              <input type="text" value={form.materialType} onChange={e => setForm({...form, materialType: e.target.value})} className="input-field" placeholder="e.g. Cotton, Silk" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value})} className="input-field">
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})} className="input-field">
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Balance ($)</label>
              <input type="number" value={form.outstandingBalance} onChange={e => setForm({...form, outstandingBalance: e.target.value})} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.isActive} onChange={e => setForm({...form, isActive: e.target.value === 'true'})} className="input-field">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" placeholder="Additional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={formLoading} className="btn-primary">{formLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add')} Supplier</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-600">Delete supplier <strong>{deleteConfirm?.companyName}</strong>?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}