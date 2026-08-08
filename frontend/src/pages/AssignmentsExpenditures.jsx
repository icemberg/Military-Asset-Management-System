import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AssignmentsExpenditures = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'expenditures'
  
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [bases, setBases] = useState([]);
  
  const [formData, setFormData] = useState({
    baseId: '',
    equipmentTypeId: '',
    quantity: '',
    personnelName: '',
    reason: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fetchAssignments = useCallback(async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchExpenditures = useCallback(async () => {
    try {
      const { data } = await api.get('/expenditures');
      setExpenditures(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [eqRes, baseRes] = await Promise.all([
        api.get('/assets/equipment-types'),
        api.get('/assets/bases')
      ]);
      setEquipmentTypes(eqRes.data);
      setBases(baseRes.data);
      
      // Auto-select base for Base Commanders
      if (user?.role === 'BASE_COMMANDER' && user.baseId) {
        setFormData(prev => ({ ...prev, baseId: String(user.baseId) }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      await fetchAssignments();
      await fetchExpenditures();
      await fetchMetadata();
    };
    init();
  }, [fetchAssignments, fetchExpenditures, fetchMetadata]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (activeTab === 'assignments') {
        await api.post('/assignments', {
          baseId: formData.baseId,
          equipmentTypeId: formData.equipmentTypeId,
          quantity: formData.quantity,
          personnelName: formData.personnelName
        });
        setSuccess('Assignment created successfully');
        fetchAssignments();
      } else {
        await api.post('/expenditures', {
          baseId: formData.baseId,
          equipmentTypeId: formData.equipmentTypeId,
          quantity: formData.quantity,
          reason: formData.reason
        });
        setSuccess('Expenditure recorded successfully');
        fetchExpenditures();
      }
      // Reset form but keep baseId if commander
      setFormData(prev => ({
        ...prev,
        equipmentTypeId: '',
        quantity: '',
        personnelName: '',
        reason: ''
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleReturn = async (id) => {
    if (!window.confirm('Are you sure you want to return this assigned equipment?')) return;
    
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/assignments/${id}/return`);
      setSuccess('Equipment returned successfully');
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to return assignment');
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'BASE_COMMANDER';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Assignments & Expenditures</h1>
      
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button 
          type="button"
          onClick={() => { setActiveTab('assignments'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 font-medium ${activeTab === 'assignments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Assignments
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('expenditures'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 font-medium ${activeTab === 'expenditures' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Expenditures
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      {canEdit && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'assignments' ? 'Create New Assignment' : 'Record Expenditure'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="baseId" className="block text-sm font-medium mb-1">Base</label>
                <select 
                  id="baseId"
                  className="w-full border rounded p-2"
                  value={formData.baseId}
                  onChange={(e) => setFormData({...formData, baseId: e.target.value})}
                  required
                  disabled={user?.role === 'BASE_COMMANDER'}
                >
                  <option value="">Select Base</option>
                  {bases.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="equipmentTypeId" className="block text-sm font-medium mb-1">Equipment Type</label>
                <select 
                  id="equipmentTypeId"
                  className="w-full border rounded p-2"
                  value={formData.equipmentTypeId}
                  onChange={(e) => setFormData({...formData, equipmentTypeId: e.target.value})}
                  required
                >
                  <option value="">Select Equipment</option>
                  {equipmentTypes.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-1">Quantity</label>
                <input 
                  id="quantity"
                  type="number"
                  min="1"
                  className="w-full border rounded p-2"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>

              {activeTab === 'assignments' ? (
                <div>
                  <label htmlFor="personnelName" className="block text-sm font-medium mb-1">Personnel Name</label>
                  <input 
                    id="personnelName"
                    type="text"
                    className="w-full border rounded p-2"
                    value={formData.personnelName}
                    onChange={(e) => setFormData({...formData, personnelName: e.target.value})}
                    required
                    placeholder="e.g. Sgt. John Doe"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium mb-1">Reason</label>
                  <input 
                    id="reason"
                    type="text"
                    className="w-full border rounded p-2"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                    placeholder="e.g. Live fire training"
                  />
                </div>
              )}
            </div>
            
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
              {activeTab === 'assignments' ? 'Create Assignment' : 'Log Expenditure'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3">Date</th>
              <th className="p-3">Base</th>
              <th className="p-3">Equipment</th>
              <th className="p-3">Quantity</th>
              {activeTab === 'assignments' ? (
                <>
                  <th className="p-3">Personnel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </>
              ) : (
                <th className="p-3">Reason</th>
              )}
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'assignments' ? assignments : expenditures).map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="p-3">{item.base.name}</td>
                <td className="p-3">{item.equipmentType.name}</td>
                <td className="p-3">{item.quantity}</td>
                {activeTab === 'assignments' ? (
                  <>
                    <td className="p-3 font-medium">{item.personnelName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${item.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.status === 'ACTIVE' && canEdit && (
                        <button 
                          type="button"
                          onClick={() => handleReturn(item.id)}
                          className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </>
                ) : (
                  <td className="p-3 text-gray-700">{item.reason}</td>
                )}
              </tr>
            ))}
            {(activeTab === 'assignments' ? assignments : expenditures).length === 0 && (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
