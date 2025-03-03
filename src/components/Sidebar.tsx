import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BarChart2, 
  Settings, 
  LogOut,
  Package
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('فشل تسجيل الخروج', error);
    }
  };

  return (
    <div
      dir="rtl"
      className={`fixed inset-y-0 right-0 z-50 w-64 bg-indigo-900 text-white flex flex-col transform transition-transform duration-300 shadow-lg ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-6 flex items-center space-x-3">
        <Package className="h-8 w-8" />
        <h1 className="text-2xl font-bold"> لوحة التحكم ELAMLI </h1>
      </div>
      
      <nav className="flex-1 mt-6">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-indigo-800 border-r-4 border-white' : 'hover:bg-indigo-800'}`
          }
          onClick={toggleSidebar}
        >
          <LayoutDashboard className="ml-3 h-5 w-5" />
          لوحة التحكم
        </NavLink>
        
        <NavLink 
          to="/orders" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-indigo-800 border-r-4 border-white' : 'hover:bg-indigo-800'}`
          }
          onClick={toggleSidebar}
        >
          <ShoppingBag className="ml-3 h-5 w-5" />
          الطلبات
        </NavLink>
        
        <NavLink 
          to="/statistics" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-indigo-800 border-r-4 border-white' : 'hover:bg-indigo-800'}`
          }
          onClick={toggleSidebar}
        >
          <BarChart2 className="ml-3 h-5 w-5" />
          الإحصائيات
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center px-6 py-3 text-lg ${isActive ? 'bg-indigo-800 border-r-4 border-white' : 'hover:bg-indigo-800'}`
          }
          onClick={toggleSidebar}
        >
          <Settings className="ml-3 h-5 w-5" />
          الإعدادات
        </NavLink>
      </nav>
      
      <div className="p-6">
        <button 
          onClick={handleLogout}
          className="flex items-center text-lg text-red-300 hover:text-white"
        >
          <LogOut className="ml-3 h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

export default Sidebar;