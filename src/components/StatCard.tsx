import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  percentChange?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  percentChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
      <div className={`rounded-full p-3 mr-4 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      
      <div>
        <h3 className="text-gray-500 font-medium">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
        
        {percentChange !== undefined && (
          <div className="flex items-center mt-2">
            <span className={`text-sm ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {percentChange >= 0 ? '+' : ''}{percentChange}%
            </span>
            <span className="text-gray-500 text-sm ml-1">from last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;