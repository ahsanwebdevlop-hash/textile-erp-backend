import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PackageCheck, Plus, QrCode, Sparkles } from 'lucide-react';

export default function BatchTracking() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generateNewForm = () => ({
    rollNumber: `ROLL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    lotNumber: `LOT-DYE-${Math.floor(100 + Math.random() * 900)}`,
    fabricName: '100% Organic Cotton Twill',
    shadeGroup: 'Shade A (Dark)',
    grossWeightKg: 45.5,
    netWeightKg: 44.0,
    lengthMeters: 120,
    widthInches: 58,
    gsm: 210,
    shrinkagePercent: 3.5,
    supplier: 'TexMaster Mills Ltd',
  });

  const [formData, setFormData] = useState(generateNewForm());

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.post('/batches', formData);
      setShowModal(false);
      fetchBatches();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error creating batch');
    }
  };

  const openNewModal = () => {
    setFormData(generateNewForm());
    setErrorMessage('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
            <Sparkles size={14} /> Barcode & Shade Control
          </span>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <PackageCheck /> Fabric Roll & Dye-Lot Batch Tracking
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Track individual fabric roll IDs, dye lot numbers, shade groups (Shade A/B/C), GSM, and shrinkage %.
          </p>
        </div>
        <button onClick={openNewModal} className="bg-white text-blue-900 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow w-full md:w-auto shrink-0">
          <Plus size={20} /> Register Fabric Roll
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading fabric roll inventory...</div>
      ) : batches.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
          <QrCode className="mx-auto text-blue-500 mb-3" size={48} />
          <h3 className="text-xl font-bold text-gray-800">No Fabric Rolls Registered Yet</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Register your fabric roll barcodes and dye lots with shade group classification to prevent color mismatches.
          </p>
          <button onClick={openNewModal} className="btn-primary">+ Register Roll Batch</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-4">Roll & Lot #</th>
                <th className="p-4">Fabric Specification</th>
                <th className="p-4">Shade Group</th>
                <th className="p-4">GSM / Width</th>
                <th className="p-4">Weight & Length</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((batch) => (
                <tr key={batch._id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-gray-900">
                    <div>{batch.rollNumber}</div>
                    <span className="text-xs text-gray-500 font-normal">{batch.lotNumber}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{batch.fabricName}</div>
                    <div className="text-xs text-gray-500">{batch.supplier}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {batch.shadeGroup}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-700">
                    <div className="font-bold">{batch.gsm} g/m²</div>
                    <div className="text-gray-500">{batch.widthInches}" width (Shrink: {batch.shrinkagePercent}%)</div>
                  </td>
                  <td className="p-4 text-xs font-medium text-gray-800">
                    <div className="font-bold">{batch.netWeightKg} kg (Net)</div>
                    <div className="text-gray-500">{batch.lengthMeters} Meters</div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Register Fabric Roll Batch</h2>
              <p className="text-xs text-gray-500">Record roll barcode, shade classification, and physical specs.</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Roll Barcode #</label>
                  <input type="text" required value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Dyeing Lot #</label>
                  <input type="text" required value={formData.lotNumber} onChange={e => setFormData({ ...formData, lotNumber: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Fabric Description</label>
                  <input type="text" required value={formData.fabricName} onChange={e => setFormData({ ...formData, fabricName: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Shade Classification</label>
                  <select value={formData.shadeGroup} onChange={e => setFormData({ ...formData, shadeGroup: e.target.value })} className="input-field">
                    <option value="Shade A (Dark)">Shade A (Dark)</option>
                    <option value="Shade B (Medium)">Shade B (Medium)</option>
                    <option value="Shade C (Light)">Shade C (Light)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">GSM (g/m²)</label>
                  <input type="number" value={formData.gsm} onChange={e => setFormData({ ...formData, gsm: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Width (Inches)</label>
                  <input type="number" value={formData.widthInches} onChange={e => setFormData({ ...formData, widthInches: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Shrinkage %</label>
                  <input type="number" step="0.1" value={formData.shrinkagePercent} onChange={e => setFormData({ ...formData, shrinkagePercent: Number(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Net Weight (kg)</label>
                  <input type="number" value={formData.netWeightKg} onChange={e => setFormData({ ...formData, netWeightKg: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Length (Meters)</label>
                  <input type="number" value={formData.lengthMeters} onChange={e => setFormData({ ...formData, lengthMeters: Number(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Roll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
