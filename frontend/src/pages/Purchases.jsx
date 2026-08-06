import { useState, useEffect } from 'react';
import api from '../services/api';

export const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [baseId, setBaseId] = useState('');
  const [equipmentTypeId, setEquipmentTypeId] = useState('');
  const [quantity, setQuantity] = useState('');

  const fetchPurchases = async () => {
    try {
      const { data } = await api.get('/purchases');
      setPurchases(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchases', { baseId, equipmentTypeId, quantity });
      setBaseId('');
      setEquipmentTypeId('');
      setQuantity('');
      fetchPurchases();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Purchases</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Log New Purchase</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Base ID</label>
            <input type="number" required className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" value={baseId} onChange={e => setBaseId(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Type ID</label>
            <input type="number" required className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" value={equipmentTypeId} onChange={e => setEquipmentTypeId(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <input type="number" required min="1" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 transition h-[42px]">
            Submit
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 font-semibold text-slate-700">ID</th>
              <th className="p-4 font-semibold text-slate-700">Base</th>
              <th className="p-4 font-semibold text-slate-700">Equipment</th>
              <th className="p-4 font-semibold text-slate-700">Quantity</th>
              <th className="p-4 font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-4">{p.id}</td>
                <td className="p-4">{p.base?.name || p.baseId}</td>
                <td className="p-4">{p.equipmentType?.name || p.equipmentTypeId}</td>
                <td className="p-4">{p.quantity}</td>
                <td className="p-4">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
