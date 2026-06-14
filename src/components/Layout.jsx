import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Restaurants', path: '/restaurants', icon: BuildingStorefrontIcon },
    { name: 'Plans & Modules', path: '/plans', icon: RectangleStackIcon },
    { name: 'Modules', path: '/modules', icon: Squares2X2Icon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg relative">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">BillPak</h1>
          <p className="text-sm text-gray-600 mt-1">Super Admin Panel</p>
        </div>

        <nav className="mt-4">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : ''
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.phone || ''}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 transition"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}