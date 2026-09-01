import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Production from './pages/Production';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import SalesOrders from './pages/SalesOrders';
import Accounts from './pages/Accounts';

import TechPackBOM from './pages/TechPackBOM';
import BatchTracking from './pages/BatchTracking';
import QualityControl from './pages/QualityControl';
import GarmentCosting from './pages/GarmentCosting';
import SustainabilityCompliance from './pages/SustainabilityCompliance';

function Layout() {
  const { isAuthenticated, loading } = useApp();
  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tech-pack-bom" element={<TechPackBOM />} />
            <Route path="/batch-tracking" element={<BatchTracking />} />
            <Route path="/quality-control" element={<QualityControl />} />
            <Route path="/garment-costing" element={<GarmentCosting />} />
            <Route path="/sustainability-compliance" element={<SustainabilityCompliance />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/production" element={<Production />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales-orders" element={<SalesOrders />} />
            <Route path="/accounts" element={<Accounts />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

export default App;