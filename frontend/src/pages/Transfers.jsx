import { useState, useEffect } from 'react';
import api from '../services/api';

export const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [sourceBaseId, setSourceBaseId] = useState('');
  const [destinationBaseId, setDestinationBaseId] = useState('');
  const [equipmentTypeId, setEquipmentTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTransfers = async () => {
    try {
      const { data } = await api.get('/transfers');
      setTransfers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ;(async () => {
      try {
        const { data } = await api.get('/transfers');
        setTransfers(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/transfers', { sourceBaseId, destinationBaseId, equipmentTypeId, quantity });
      setSourceBaseId('');
      setDestinationBaseId('');
      setEquipmentTypeId('');
      setQuantity('');
      setSuccessMsg('Transfer completed successfully!');
      fetchTransfers();
    } catch (error) {
      setErrorMsg(error.response?.data?.error || error.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Transfers</h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Initiate Transfer</h2>
        {errorMsg && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-100 text-emerald-700 p-3 rounded mb-4">{successMsg}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="sourceBaseId" className="block text-sm font-medium text-slate-700 mb-1">Source Base ID</label>
            <input id="sourceBaseId" type="number" required className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" value={sourceBaseId} onChange={e => setSourceBaseId(e.target.value)} />
          </div>
          <div>
            <label htmlFor="destinationBaseId" className="block text-sm font-medium text-slate-700 mb-1">Destination Base ID</label>
            <input id="destinationBaseId" type="number" required className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" value={destinationBaseId} onChange={e => setDestinationBaseId(e.target.value)} />
          </div>
          <div>
            <label htmlFor="equipmentTypeId" className="block text-sm font-medium text-slate-700 mb-1">Equipment Type ID</label>
            <input id="equipmentTypeId" type="number" required className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" value={equipmentTypeId} onChange={e => setEquipmentTypeId(e.target.value)} />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <input id="quantity" type="number" required min="1" className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div className="col-span-4 flex justify-end">
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 transition h-[42px]">
              Transfer
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 font-semibold text-slate-700">ID</th>
              <th className="p-4 font-semibold text-slate-700">Source</th>
              <th className="p-4 font-semibold text-slate-700">Destination</th>
              <th className="p-4 font-semibold text-slate-700">Equipment</th>
              <th className="p-4 font-semibold text-slate-700">Quantity</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map(t => (
              <tr key={t.id} className="border-t hover:bg-slate-50">
                <td className="p-4">{t.id}</td>
                <td className="p-4">{t.sourceBase?.name || t.sourceBaseId}</td>
                <td className="p-4">{t.destinationBase?.name || t.destinationBaseId}</td>
                <td className="p-4">{t.equipmentType?.name || t.equipmentTypeId}</td>
                <td className="p-4">{t.quantity}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
