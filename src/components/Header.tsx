import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <h2 className="text-2xl font-semibold text-gray-800">
        Welcome back, Admin
      </h2>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-indigo-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 rounded-full p-2">
            <User className="h-5 w-5 text-white" />
          </div>
          <span className="text-gray-700 font-medium">
            {currentUser?.email?.split('@')[0]}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;