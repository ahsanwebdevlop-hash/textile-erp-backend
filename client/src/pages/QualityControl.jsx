import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ShieldCheck, Plus, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export default function QualityControl() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generateNewForm = () => ({
    inspectionNumber: `QC-INSP-${Math.floor(1000 + Math.random() * 9000)}`,
    inspectionType: 'Garment AQL 2.5',
    batchOrOrderId: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
    inspectedQuantity: 1200,
    sampleSize: 80,
    totalDefects: 2,
    fourPointScore: 12,
    status: 'PASSED',
    inspectorName: 'Senior QC Inspector',
    remarks: 'AQL 2.5 passed. Minor stitching deviation on 2 samples corrected.',
    defects: [
      { defectType: 'Broken Stitch', severity: 'Minor', defectCount: 2, pointsPenalty: 2 }
    ]
  });

  const [formData, setFormData] = useState(generateNewForm());

  const fetchInspections = async () => {
    try {
      const res = await api.get('/quality');
      setInspections(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.post('/quality', formData);
      setShowModal(false);
      fetchInspections();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error saving inspection');
    }
  };

  const openNewModal = () => {
    setFormData(generateNewForm());
    setErrorMessage('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-950 to-indigo-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-purple-500/30 text-purple-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
            <Sparkles size={14} /> Quality Audit Standard
          </span>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck /> Quality Control & Inspection System
          </h1>
          <p className="text-purple-200 text-sm mt-1">
            Perform 4-Point System Fabric Inspection and Garment AQL 2.5 Audit logging.
          </p>
        </div>
        <button onClick={openNewModal} className="bg-white text-purple-950 font-bold px-5 py-3 rounded-xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow w-full md:w-auto shrink-0">
          <Plus size={20} /> Log Quality Inspection
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading quality audit reports...</div>
      ) : inspections.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
          <ShieldCheck className="mx-auto text-purple-500 mb-3" size={48} />
          <h3 className="text-xl font-bold text-gray-800">No Quality Audits Filed Yet</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Record fabric and garment quality inspection passes/fails for buyer verification.
          </p>
          <button onClick={openNewModal} className="btn-primary">+ File Quality Audit</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspections.map((insp) => (
            <div key={insp._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-gray-500">{insp.inspectionNumber}</span>
                    <h3 className="font-bold text-gray-900 text-lg mt-1">{insp.inspectionType}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shrink-0 ${
                    insp.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {insp.status === 'PASSED' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {insp.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1.5 text-gray-600 mb-3 border border-gray-100">
                  <p><span className="font-bold text-gray-800">Order/Batch ID:</span> {insp.batchOrOrderId}</p>
                  <p><span className="font-bold text-gray-800">Batch Qty:</span> {insp.inspectedQuantity} pcs (Sample: {insp.sampleSize})</p>
                  {insp.inspectionType.includes('4-Point') ? (
                    <p><span className="font-bold text-gray-800">4-Point Score:</span> <span className="font-extrabold text-indigo-700">{insp.fourPointScore} pts / 100 sq yds</span></p>
                  ) : (
                    <p><span className="font-bold text-gray-800">Defects Found:</span> <span className="font-extrabold text-amber-700">{insp.totalDefects} defects</span></p>
                  )}
                  <p><span className="font-bold text-gray-800">Inspector:</span> {insp.inspectorName}</p>
                </div>
              </div>

              {insp.remarks && (
                <p className="text-xs text-gray-600 italic border-l-2 border-purple-400 pl-3">
                  "{insp.remarks}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900">File Quality Inspection Audit</h2>
              <p className="text-xs text-gray-500">Record 4-Point System penalty points or Garment AQL 2.5 results.</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Inspection Standard</label>
                  <select value={formData.inspectionType} onChange={e => setFormData({ ...formData, inspectionType: e.target.value })} className="input-field">
                    <option value="Garment AQL 2.5">Garment AQL 2.5 (Major/Minor)</option>
                    <option value="4-Point Fabric Inspection">4-Point System (Fabric Rolls)</option>
                    <option value="In-Line Sewing Audit">In-Line Sewing DHU Audit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Batch / Order ID</label>
                  <input type="text" required value={formData.batchOrOrderId} onChange={e => setFormData({ ...formData, batchOrOrderId: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Batch Qty</label>
                  <input type="number" value={formData.inspectedQuantity} onChange={e => setFormData({ ...formData, inspectedQuantity: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Sample Size</label>
                  <input type="number" value={formData.sampleSize} onChange={e => setFormData({ ...formData, sampleSize: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Verdict</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="input-field">
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="CONDITIONAL_ACCEPTANCE">CONDITIONAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Inspector Name</label>
                <input type="text" required value={formData.inspectorName} onChange={e => setFormData({ ...formData, inspectorName: e.target.value })} className="input-field" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Remarks / Corrective Action</label>
                <textarea rows="2" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} className="input-field" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Inspection Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
