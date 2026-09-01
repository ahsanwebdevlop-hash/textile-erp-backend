import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileCode, Plus, Layers, Sparkles } from 'lucide-react';

export default function TechPackBOM() {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    styleNumber: '',
    styleName: '',
    garmentType: 'T-Shirt',
    targetGSM: 180,
    fabricComposition: '100% Combed Cotton Single Jersey',
    items: [
      { materialName: '30s/1 Combed Cotton Yarn', category: 'Yarn', consumption: 0.22, unit: 'KG', unitCost: 4.5, totalCost: 0.99 },
      { materialName: 'Reactive Eco Blue Dye', category: 'Dye Chemical', consumption: 0.015, unit: 'KG', unitCost: 12.0, totalCost: 0.18 },
      { materialName: 'Polyester Thread 120s', category: 'Trim', consumption: 50, unit: 'Yards', unitCost: 0.002, totalCost: 0.10 },
    ],
  });

  const fetchBOMs = async () => {
    try {
      const res = await api.get('/bom');
      setBoms(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOMs();
  }, []);

  const calculateTotalBOM = (items) => items.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalBOMCost = calculateTotalBOM(formData.items);
      await api.post('/bom', { ...formData, totalBOMCost });
      setShowModal(false);
      fetchBOMs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving BOM');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
            <Sparkles size={14} /> Garment Recipe & Materials
          </span>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileCode /> Tech Pack & Bill of Materials (BOM)
          </h1>
          <p className="text-indigo-200 text-sm mt-1">
            This module lets you build the exact "ingredient list" for any clothes you manufacture (Yarn, Dyes, Thread, Buttons, Zippers & Costs).
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-white text-indigo-900 font-bold px-5 py-3 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow w-full md:w-auto shrink-0">
          <Plus size={20} /> Create New Tech Pack
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading clothing recipes...</div>
      ) : boms.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
          <Layers className="mx-auto text-indigo-400 mb-3" size={48} />
          <h3 className="text-xl font-bold text-gray-800">No Tech Packs Created Yet</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            A Tech Pack is the blueprint of a garment. It details what materials are needed and how much each piece costs to make.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Create First Garment Recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boms.map((bom) => (
            <div key={bom._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <span className="text-xs font-extrabold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                      {bom.styleNumber}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg mt-2">{bom.styleName}</h3>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shrink-0">
                    ${bom.totalBOMCost?.toFixed(2)} / pc
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1.5 mb-4 bg-gray-50 p-3 rounded-xl">
                  <p><span className="font-semibold text-gray-800">Garment Type:</span> {bom.garmentType}</p>
                  <p><span className="font-semibold text-gray-800">Target GSM:</span> {bom.targetGSM} g/m²</p>
                  <p><span className="font-semibold text-gray-800">Fabric Spec:</span> {bom.fabricComposition}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ingredients ({bom.items?.length || 0} Items)</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {bom.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-50 text-gray-700">
                      <span>{item.materialName} ({item.consumption} {item.unit})</span>
                      <span className="font-bold text-gray-900">${item.totalCost?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Garment Recipe (Tech Pack)</h2>
              <p className="text-xs text-gray-500">Fill in the garment details and raw material requirements.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Style / Item Code</label>
                  <input type="text" required value={formData.styleNumber} onChange={e => setFormData({ ...formData, styleNumber: e.target.value })} className="input-field" placeholder="e.g. STY-TSHIRT-01" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Garment Name</label>
                  <input type="text" required value={formData.styleName} onChange={e => setFormData({ ...formData, styleName: e.target.value })} className="input-field" placeholder="e.g. Premium Cotton Crewneck" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Garment Type</label>
                  <select value={formData.garmentType} onChange={e => setFormData({ ...formData, garmentType: e.target.value })} className="input-field">
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Polo">Polo Shirt</option>
                    <option value="Denim Jeans">Denim Jeans</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Dress">Dress</option>
                    <option value="Bedding">Bedding / Home</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Fabric Weight (GSM)</label>
                  <input type="number" value={formData.targetGSM} onChange={e => setFormData({ ...formData, targetGSM: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Fabric Blend</label>
                  <input type="text" value={formData.fabricComposition} onChange={e => setFormData({ ...formData, fabricComposition: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Recipe Items (Yarns, Dyes, Threads, Trims)</h3>
                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:grid sm:grid-cols-5 gap-2 items-center bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                      <input type="text" value={item.materialName} onChange={e => {
                        const updated = [...formData.items];
                        updated[idx].materialName = e.target.value;
                        setFormData({ ...formData, items: updated });
                      }} className="input-field text-xs sm:col-span-2 w-full" placeholder="Material Name" />
                      <input type="number" step="0.001" value={item.consumption} onChange={e => {
                        const updated = [...formData.items];
                        updated[idx].consumption = Number(e.target.value);
                        updated[idx].totalCost = updated[idx].consumption * updated[idx].unitCost;
                        setFormData({ ...formData, items: updated });
                      }} className="input-field text-xs w-full" placeholder="Qty per pc" />
                      <input type="number" step="0.01" value={item.unitCost} onChange={e => {
                        const updated = [...formData.items];
                        updated[idx].unitCost = Number(e.target.value);
                        updated[idx].totalCost = updated[idx].consumption * updated[idx].unitCost;
                        setFormData({ ...formData, items: updated });
                      }} className="input-field text-xs w-full" placeholder="Price/unit" />
                      <div className="font-bold text-gray-900 text-right w-full sm:w-auto">${item.totalCost?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Garment Recipe</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
