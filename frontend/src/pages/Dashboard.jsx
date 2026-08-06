import { useState, useEffect } from 'react';
import api from '../services/api';

import { StatCard } from '../components/StatCard';
import { NetMoveModal } from '../components/NetMoveModal';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/assets/metrics');
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
