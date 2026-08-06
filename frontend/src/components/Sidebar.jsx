import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Truck } from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
    { name: 'Purchases', path: '/purchases', icon: ShoppingCart, roles: ['ADMIN', 'LOGISTICS_OFFICER'] },
    { name: 'Transfers', path: '/transfers', icon: Truck, roles: ['ADMIN', 'LOGISTICS_OFFICER'] }
  ];

  return (
    <aside className="w-64 bg-white border-r min-h-screen shadow-sm hidden md:block">
      <nav className="p-4 space-y-2">
        {links.filter(link => link.roles.includes(user.role)).map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition ${isActive ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
