import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';
import { format, subDays } from 'date-fns';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import Header from '../components/Header';
import { Order } from '../types';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Statistics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);
        
        if (snapshot.exists()) {
          const ordersData = snapshot.val();
          const ordersArray: Order[] = Object.keys(ordersData).map(key => ({
            id: key,
            ...ordersData[key]
          }));
          
          setOrders(ordersArray);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  // Filter orders based on selected time range
  const getFilteredOrders = () => {
    const now = new Date();
    let daysToSubtract = 30;
    
    if (timeRange === '7days') daysToSubtract = 7;
    else if (timeRange === '90days') daysToSubtract = 90;
    
    const cutoffDate = subDays(now, daysToSubtract).getTime();
    return orders.filter(order => order.createdAt >= cutoffDate);
  };

  const filteredOrders = getFilteredOrders();

  // Prepare data for charts
  const prepareRevenueData = () => {
    const data: Record<string, { date: string; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      const date = format(new Date(order.createdAt), 'MMM dd');
      if (!data[date]) {
        data[date] = { date, revenue: 0 };
      }
      data[date].revenue += Number(order.productPrice) || 0;
    });
    
    return Object.values(data);
  };

  const prepareStatusData = () => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    filteredOrders.forEach(order => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
    });
    
    return Object.keys(statusCounts).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCounts[status]
    }));
  };

  const prepareCityData = () => {
    const cityCounts: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      if (!cityCounts[order.city]) {
        cityCounts[order.city] = 0;
      }
      cityCounts[order.city]++;
    });
    
    // Sort by count and take top 5
    return Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));
  };

  const revenueData = prepareRevenueData();
  const statusData = prepareStatusData();
  const cityData = prepareCityData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <Header />
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Statistics & Analytics</h2>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Time Range:</span>
            <select
              className="block pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Order Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Orders by City */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Cities by Orders</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Orders" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary Statistics</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h4>
                <p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h4>
                <p className="text-3xl font-bold text-gray-900">
                  ${filteredOrders.reduce((sum, order) => sum + (Number(order.productPrice) || 0), 0).toFixed(2)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h4>
                <p className="text-3xl font-bold text-gray-900">
                  ${filteredOrders.length > 0 
                    ? (filteredOrders.reduce((sum, order) => sum + (Number(order.productPrice) || 0), 0) / filteredOrders.length).toFixed(2) 
                    : '0.00'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Completed Orders</h4>
                <p className="text-3xl font-bold text-gray-900">
                  {filteredOrders.filter(order => order.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;