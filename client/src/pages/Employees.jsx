import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../utils/api.js';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const DEPARTMENTS = ['Production', 'Quality Control', 'Warehouse', 'Design', 'Sales', 'Administration', 'Maintenance'];
const ROLES = ['Production Manager', 'QC Inspector', 'Inventory Supervisor', 'Textile Designer', 'Machine Operator', 'Sales Executive', 'Admin Assistant', 'Maintenance Technician', 'Supervisor', 'Operator'];

export default function Employees() {
  const { hasRole } = useApp();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ name: '', department: 'Production', role: 'Operator', phone: '', joiningDate: '' });

  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try { const res = await api.get('/employees'); setEmployees(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ name: '', department: 'Production', role: 'Operator', phone: '', joiningDate: '' }); setEditingEmployee(null); };
  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (emp) => {
    setForm({ name: emp.name, department: emp.department, role: emp.role, phone: emp.phone, joiningDate: emp.joiningDate?.split('T')[0] || '' });
    setEditingEmployee(emp); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      if (editingEmployee) { await api.put(`/employees/${editingEmployee._id}`, form); }
      else { await api.post('/employees', form); }
      await fetchEmployees(); setModalOpen(false); resetForm();
    } catch (err) { alert(err.response?.data?.message || 'Error saving employee'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/employees/${id}`); await fetchEmployees(); setDeleteConfirm(null); }
    catch (err) { alert(err.response?.data?.message || 'Error deleting employee'); }
  };

  const deptColors = {
    'Production': 'bg-blue-100 text-blue-700', 'Quality Control': 'bg-emerald-100 text-emerald-700',
    'Warehouse': 'bg-amber-100 text-amber-700', 'Design': 'bg-violet-100 text-violet-700',
    'Sales': 'bg-rose-100 text-rose-700', 'Administration': 'bg-gray-100 text-gray-700',
    'Maintenance': 'bg-orange-100 text-orange-700',
  };

  const columns = [
    { key: 'name', label: 'Employee', render: (val) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-textile-100 flex items-center justify-center text-textile-700 font-semibold text-sm">{val.split(' ').map(n => n[0]).join('')}</div>
        <span className="font-medium text-gray-900">{val}</span>
      </div>
    )},
    { key: 'department', label: 'Department', render: (val) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deptColors[val]}`}>{val}</span> },
    { key: 'role', label: 'Role' },
    { key: 'phone', label: 'Phone' },
    { key: 'joiningDate', label: 'Joining Date', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
  ];

  const deptSummary = DEPARTMENTS.map(dept => ({ dept, count: employees.filter(e => e.department === dept).length })).filter(d => d.count > 0);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading employees...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your workforce and departments</p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary"><Plus size={18} /> Add Employee</button>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {deptSummary.map(({ dept, count }) => (
          <div key={dept} className="card p-4 text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">{dept}</p>
            <p className="text-xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>
      <DataTable columns={columns} data={employees} searchKeys={['name', 'department', 'role', 'phone']}
        actions={canEdit ? (row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
            <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
          </>
        ) : null} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Full name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-field">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-field">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+1-555-0000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
              <input type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={formLoading}>{formLoading ? 'Saving...' : (editingEmployee ? 'Update' : 'Add')} Employee</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="text-red-500" size={24} /></div>
          <p className="text-gray-600 mb-6">Remove <strong>{deleteConfirm?.name}</strong>?</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
