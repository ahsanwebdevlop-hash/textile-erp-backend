import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Award, Plus, Calendar, CheckCircle, Sparkles } from 'lucide-react';

export default function SustainabilityCompliance() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generateNewForm = () => ({
    certificateNumber: `OEKO-TEX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    certificationType: 'OEKO-TEX Standard 100',
    issuingAuthority: 'TESTEX AG Zurich',
    supplierOrFacility: 'TextileFlow Dyeing Facility Unit 1',
    issueDate: '2025-01-10',
    expiryDate: '2027-01-10',
    status: 'Active',
    scopeNotes: 'Certified Class I eco-friendly reactive dye testing for babywear and organic cotton.',
  });

  const [formData, setFormData] = useState(generateNewForm());

  const fetchCerts = async () => {
    try {
      const res = await api.get('/compliance');
      setCerts(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.post('/compliance', formData);
      setShowModal(false);
      fetchCerts();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error saving certificate');
    }
  };

  const openNewModal = () => {
    setFormData(generateNewForm());
    setErrorMessage('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-950 to-teal-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit mb-2">
            <Sparkles size={14} /> International Eco Compliance
          </span>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Award /> Sustainability & Compliance Standards
          </h1>
          <p className="text-emerald-200 text-sm mt-1">
            Track OEKO-TEX, GOTS Organic Cotton, ZDHC Chemical Safety & Social Audits (WRAP, BSCI).
          </p>
        </div>
        <button onClick={openNewModal} className="bg-white text-emerald-950 font-bold px-5 py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow w-full md:w-auto shrink-0">
          <Plus size={20} /> Register Certificate
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-medium">Loading compliance records...</div>
      ) : certs.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-gray-200 text-center shadow-sm">
          <Award className="mx-auto text-emerald-500 mb-3" size={48} />
          <h3 className="text-xl font-bold text-gray-800">No Certificates Registered Yet</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Keep track of GOTS, OEKO-TEX, and ZDHC sustainability compliance for international buyers.
          </p>
          <button onClick={openNewModal} className="btn-primary">+ Add Certificate</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map((cert) => (
            <div key={cert._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {cert.certificationType}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg mt-2">{cert.certificateNumber}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-green-100 text-green-800 flex items-center gap-1 shrink-0">
                    <CheckCircle size={14} /> {cert.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-gray-600 mb-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p><span className="font-bold text-gray-800">Facility / Supplier:</span> {cert.supplierOrFacility}</p>
                  <p><span className="font-bold text-gray-800">Issuing Body:</span> {cert.issuingAuthority}</p>
                  <p className="flex items-center gap-1 text-gray-500 font-medium">
                    <Calendar size={13} /> Valid: {new Date(cert.issueDate).toLocaleDateString()} — {new Date(cert.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {cert.scopeNotes && (
                <p className="text-xs text-gray-600 italic border-l-2 border-emerald-500 pl-3">
                  "{cert.scopeNotes}"
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
              <h2 className="text-xl font-bold text-gray-900">Register Compliance Certificate</h2>
              <p className="text-xs text-gray-500">Log international environmental or social audit certificates.</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Certificate Standard</label>
                  <select value={formData.certificationType} onChange={e => setFormData({ ...formData, certificationType: e.target.value })} className="input-field">
                    <option value="OEKO-TEX Standard 100">OEKO-TEX Standard 100</option>
                    <option value="GOTS Organic">GOTS Organic Cotton</option>
                    <option value="ZDHC Chemical Safety">ZDHC Zero Discharge</option>
                    <option value="ISO 9001 Quality">ISO 9001 Quality</option>
                    <option value="WRAP Social Audit">WRAP Social Audit</option>
                    <option value="BSCI Audit">BSCI Audit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Certificate #</label>
                  <input type="text" required value={formData.certificateNumber} onChange={e => setFormData({ ...formData, certificateNumber: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Facility / Supplier</label>
                  <input type="text" required value={formData.supplierOrFacility} onChange={e => setFormData({ ...formData, supplierOrFacility: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Issuing Body</label>
                  <input type="text" required value={formData.issuingAuthority} onChange={e => setFormData({ ...formData, issuingAuthority: e.target.value })} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Issue Date</label>
                  <input type="date" required value={formData.issueDate} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Expiry Date</label>
                  <input type="date" required value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className="input-field" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Scope & Audit Notes</label>
                <textarea rows="2" value={formData.scopeNotes} onChange={e => setFormData({ ...formData, scopeNotes: e.target.value })} className="input-field" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Certificate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
