import { useState, useEffect } from 'react';
import api from '../services/api';

import { StatCard } from '../components/StatCard';
import { NetMoveModal } from '../components/NetMoveModal';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({
    baseId: '',
    equipmentTypeId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [eqRes, baseRes] = await Promise.all([
          api.get('/assets/equipment-types'),
          api.get('/assets/bases')
        ]);
        setEquipmentTypes(eqRes.data);
        setBases(baseRes.data);
      } catch (err) {
        console.error('Failed to fetch metadata', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (filters.baseId) queryParams.append('baseId', filters.baseId);
        if (filters.equipmentTypeId) queryParams.append('equipmentTypeId', filters.equipmentTypeId);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        
        const { data } = await api.get(`/assets/metrics?${queryParams.toString()}`);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [filters]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base</label>
          <select 
            id="baseId"
            className="w-full border rounded p-2"
            value={filters.baseId}
            onChange={(e) => setFilters({...filters, baseId: e.target.value})}
          >
            <option value="">All Bases</option>
            {bases.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</label>
          <select 
            id="equipmentTypeId"
            className="w-full border rounded p-2"
            value={filters.equipmentTypeId}
            onChange={(e) => setFilters({...filters, equipmentTypeId: e.target.value})}
          >
            <option value="">All Types</option>
            {equipmentTypes.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input 
            type="date"
            className="w-full border rounded p-2"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input 
            type="date"
            className="w-full border rounded p-2"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          />
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard 
            title="Opening Balance" 
            value={metrics.openingBalance} 
            colorClass="border-blue-600" 
          />
          <StatCard 
            title="Net Movement" 
            value={metrics.netMovement} 
            colorClass="border-emerald-600" 
            interactive={true}
            onClick={() => setShowModal(true)}
          />
          <StatCard 
            title="Closing Balance" 
            value={metrics.closingBalance} 
            colorClass="border-indigo-600" 
          />
          <StatCard 
            title="Assigned" 
            value={metrics.assigned} 
            colorClass="border-yellow-500" 
          />
          <StatCard 
            title="Expended" 
            value={metrics.expended} 
            colorClass="border-red-600" 
          />
          <StatCard 
            title="Available Stock" 
            value={metrics.availableStock} 
            colorClass="border-cyan-500" 
          />
        </div>
      )}

      {showModal && (
        <NetMoveModal 
          metrics={metrics} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};
