export const StatCard = ({ title, value, colorClass, onClick, interactive }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-lg shadow-md border-l-4 stat-card ${colorClass} ${interactive ? 'cursor-pointer hover:bg-slate-50 transition' : ''}`}
  >
    <h3 className="text-gray-500 text-sm font-semibold">{title}</h3>
    <p className={`text-2xl font-bold ${interactive ? 'text-emerald-700' : ''}`}>{value}</p>
  </div>
);
