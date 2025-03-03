import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

interface HeaderProps {
  pendingOrdersCount?: number; // عدد الطلبات المعلقة (اختياري)
}

const Header: React.FC<HeaderProps> = ({ pendingOrdersCount = 0 }) => {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center" dir="rtl">
        {/* زر القائمة على اليمين */}
        <button 
          className="p-2 text-indigo-900" 
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* العنوان في الوسط */}
        <h2 className="text-2xl font-semibold text-gray-800">
          مرحباً بعودتك، أدمن
        </h2>

        {/* الإشعارات والمستخدم على اليسار */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <Link to="/orders?status=pending" className="relative">
            <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors" />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {pendingOrdersCount}
              </span>
            )}
          </Link>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="bg-indigo-600 rounded-full p-2">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="text-gray-700 font-medium">
              {currentUser?.email?.split('@')[0] || 'أدمن'}
            </span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Header;