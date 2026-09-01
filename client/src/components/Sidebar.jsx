import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Package, Factory, Users, FileText,
  Truck, ShoppingCart, ShoppingBag, Wallet,
  LogOut, Menu, X, Factory as FactoryIcon,
  FileCode, PackageCheck, ShieldCheck, Calculator, Award
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { path: '/tech-pack-bom', label: 'Tech Pack (BOM)', icon: FileCode, roles: ['admin', 'manager'] },
  { path: '/production', label: 'Mill Production', icon: Factory, roles: ['admin', 'manager'] },
  { path: '/batch-tracking', label: 'Roll & Lot Batches', icon: PackageCheck, roles: ['admin', 'manager'] },
  { path: '/quality-control', label: 'Quality Audit (AQL)', icon: ShieldCheck, roles: ['admin', 'manager'] },
  { path: '/garment-costing', label: 'FOB Costing Sheet', icon: Calculator, roles: ['admin', 'manager'] },
  { path: '/sustainability-compliance', label: 'Compliance & Audits', icon: Award, roles: ['admin', 'manager'] },
  { path: '/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'manager'] },
  { path: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'manager'] },
  { path: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'manager'] },
  { path: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['admin', 'manager'] },
  { path: '/sales-orders', label: 'Sales Orders', icon: ShoppingBag, roles: ['admin', 'manager'] },
  { path: '/accounts', label: 'Accounts', icon: Wallet, roles: ['admin', 'manager'] },
  { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'manager'] },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user, hasRole } = useApp();
  const location = useLocation();
  const filteredNav = navItems.filter(item => hasRole(item.roles));

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-textile-600 text-white rounded-lg shadow-lg">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-textile-600 rounded-xl flex items-center justify-center">
              <FactoryIcon className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">TextileFlow</h1>
              <p className="text-xs text-gray-500">ERP System</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Employee'}</p>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200">
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}