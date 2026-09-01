import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Calculator, Plus, DollarSign, Sparkles } from 'lucide-react';

export default function GarmentCosting() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const generateNewForm = () => ({
    costingNumber: `FOB-COST-${Math.floor(1000 + Math.random() * 9000)}`,
    styleNumber: 'STY-DENIM-501',
    customerName: 'Global Denim Corp',
    orderQuantity: 5000,
    yarnCostPerPiece: 2.80,
    knittingWeavingCostPerPiece: 1.20,
    dyeingFinishingCostPerPiece: 1.50,
    trimsCostPerPiece: 0.90,
    cmtCostPerPiece: 3.50,
    freightAndLogisticsPerPiece: 0.60,
    targetMarginPercent: 25,
  });

  const [formData, setFormData] = useState(generateNewForm());

  const fetchSheets = async () => {
    try {
      const res = await api.get('/costing');
      setSheets(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  const calculateFOB = (data) => {
    const yarn = Number(data.yarnCostPerPiece) || 0;
    const weaving = Number(data.knittingWeavingCostPerPiece) || 0;
    const dyeing = Number(data.dyeingFinishingCostPerPiece) || 0;
    const trims = Number(data.trimsCostPerPiece) || 0;
    const cmt = Number(data.cmtCostPerPiece) || 0;
    const freight = Number(data.freightAndLogisticsPerPiece) || 0;
    const marginPct = Number(data.targetMarginPercent) || 0;
    const qty = Number(data.orderQuantity) || 1;

    const subtotal = yarn + weaving + dyeing + trims + cmt + freight;
    const margin = subtotal * (marginPct / 100);
    const fob = subtotal + margin;
    return { subtotal, fob, totalOrder: fob * qty };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const { subtotal, fob, totalOrder } = calculateFOB(formData);
      await api.post('/costing', {
        ...formData,
        subtotalCostPerPiece: subtotal,
        quotedFOBPricePerPiece: fob,
        totalOrderFOBValue: totalOrder,
      });
      setShowModal(false);
      fetchSheets();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error saving costing sheet');
    }
  };

  const openNewModal = () => {
    setFormData(generateNewForm());
    setErrorMessage('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-900 to-teal-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
            <Sparkles size={14} /> Export Profitability Engine
          </span>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calculator /> Garment FOB & CMT Costing Sheet
          </h1>
          <p className="text-emerald-100 text-sm mt-1">
            Calculate your manufacturing costs (Yarn, Dyeing, CMT Sewing, Trims) and auto-generate export selling quotes.
          </p>
        </div>
        <button onClick={openNewModal} className="bg-white text-emerald-900 font-bold px-5 py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow w-full md:w-auto shrink-0">
          <Plus size={20} /> New Costing Estimation
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading costing sheets...</div>
      ) : sheets.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
          <DollarSign className="mx-auto text-emerald-500 mb-3" size={48} />
          <h3 className="text-xl font-bold text-gray-800">No Costing Sheets Created Yet</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Calculate garment FOB export quotes and CMT margin breakdowns to protect your profit margins.
          </p>
          <button onClick={openNewModal} className="btn-primary">+ Create Costing Sheet</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheets.map((sheet) => (
            <div key={sheet._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {sheet.costingNumber}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg mt-2">{sheet.styleNumber}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                    {sheet.customerName}
                  </span>
                </div>

                <div className="my-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 block font-medium">Quoted FOB / pc</span>
                    <span className="text-2xl font-black text-emerald-700">${sheet.quotedFOBPricePerPiece?.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block font-medium">Profit Margin</span>
                    <span className="text-base font-extrabold text-indigo-700">{sheet.targetMarginPercent}%</span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 text-gray-600 border-t border-gray-100 pt-3">
                  <div className="flex justify-between"><span>Yarn Cost:</span><span className="font-bold text-gray-900">${sheet.yarnCostPerPiece?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Dyeing & Finishing:</span><span className="font-bold text-gray-900">${sheet.dyeingFinishingCostPerPiece?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>CMT Labor:</span><span className="font-bold text-gray-900">${sheet.cmtCostPerPiece?.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Trims & Accessories:</span><span className="font-bold text-gray-900">${sheet.trimsCostPerPiece?.toFixed(2)}</span></div>
                  <div className="flex justify-between font-extrabold text-gray-900 border-t border-gray-200 pt-2 text-sm">
                    <span>Order Total ({sheet.orderQuantity} pcs):</span>
                    <span className="text-emerald-700">${sheet.totalOrderFOBValue?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl my-auto">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Garment FOB Costing Calculator</h2>
              <p className="text-xs text-gray-500">Calculate material, labor, and export margin costs.</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Costing Code #</label>
                  <input type="text" required value={formData.costingNumber} onChange={e => setFormData({ ...formData, costingNumber: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Garment Style #</label>
                  <input type="text" required value={formData.styleNumber} onChange={e => setFormData({ ...formData, styleNumber: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Customer / Buyer</label>
                  <input type="text" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Order Quantity (pcs)</label>
                  <input type="number" required value={formData.orderQuantity} onChange={e => setFormData({ ...formData, orderQuantity: Number(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Yarn ($/pc)</label>
                  <input type="number" step="0.01" value={formData.yarnCostPerPiece} onChange={e => setFormData({ ...formData, yarnCostPerPiece: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Weaving/Knitting</label>
                  <input type="number" step="0.01" value={formData.knittingWeavingCostPerPiece} onChange={e => setFormData({ ...formData, knittingWeavingCostPerPiece: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Dyeing/Finishing</label>
                  <input type="number" step="0.01" value={formData.dyeingFinishingCostPerPiece} onChange={e => setFormData({ ...formData, dyeingFinishingCostPerPiece: Number(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Trims & Buttons</label>
                  <input type="number" step="0.01" value={formData.trimsCostPerPiece} onChange={e => setFormData({ ...formData, trimsCostPerPiece: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">CMT Sewing Labor</label>
                  <input type="number" step="0.01" value={formData.cmtCostPerPiece} onChange={e => setFormData({ ...formData, cmtCostPerPiece: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Freight & Logistics</label>
                  <input type="number" step="0.01" value={formData.freightAndLogisticsPerPiece} onChange={e => setFormData({ ...formData, freightAndLogisticsPerPiece: Number(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Target Profit Margin %</label>
                <input type="number" value={formData.targetMarginPercent} onChange={e => setFormData({ ...formData, targetMarginPercent: Number(e.target.value) })} className="input-field" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Generate Costing Quote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
