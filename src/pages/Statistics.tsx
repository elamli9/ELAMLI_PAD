import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
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
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Header from '../components/Header';
import { Order } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

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
        console.error('خطأ في جلب الطلبات:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  const getFilteredOrders = () => {
    const now = new Date();
    let daysToSubtract = 30;
    
    if (timeRange === '7days') daysToSubtract = 7;
    else if (timeRange === '90days') daysToSubtract = 90;
    
    const cutoffDate = subDays(now, daysToSubtract).getTime();
    return orders.filter(order => (order.createdAt || 0) >= cutoffDate);
  };

  const filteredOrders = getFilteredOrders();

  const prepareRevenueData = () => {
    const data: Record<string, { date: string; revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      const date = format(new Date(order.createdAt || 0), 'dd MMMM', { locale: ar });
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
      name: {
        pending: 'معلق',
        processing: 'قيد المعالجة',
        shipped: 'تم الشحن',
        delivered: 'تم التسليم',
        cancelled: 'ملغى'
      }[status],
      value: statusCounts[status],
      englishName: status.charAt(0).toUpperCase() + status.slice(1)
    }));
  };

  const prepareCityData = () => {
    const cityCounts: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      const city = order.city || 'غير محدد';
      if (!cityCounts[city]) {
        cityCounts[city] = 0;
      }
      cityCounts[city]++;
    });
    
    return Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));
  };

  const revenueData = prepareRevenueData();
  const statusData = prepareStatusData();
  const cityData = prepareCityData();

  const downloadReport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    doc.setFont('Arial', 'normal');
    
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229);
    doc.text('ELAMLI', 180, 20);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(79, 70, 229);
    doc.line(20, 25, 190, 25);
    
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.text('Statistics Report', 180, 40);
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Time Range: ${timeRange === '7days' ? 'Last 7 Days' : timeRange === '30days' ? 'Last 30 Days' : 'Last 90 Days'}`,
      180,
      50
    );
    doc.text(`Report Date: ${format(new Date(), 'yyyy-MM-dd')}`, 180, 60);
    
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('General Statistics', 180, 80);
    
    doc.autoTable({
      startY: 85,
      head: [['Description', 'Value']],
      body: [
        ['Total Orders', filteredOrders.length.toString()],
        ['Total Revenue', `$${filteredOrders.reduce((sum, order) => sum + (Number(order.productPrice) || 0), 0).toFixed(2)}`],
        ['Average Order Value', `$${filteredOrders.length > 0 ? (filteredOrders.reduce((sum, order) => sum + (Number(order.productPrice) || 0), 0) / filteredOrders.length).toFixed(2) : '0.00'}`],
        ['Completed Orders', filteredOrders.filter(order => order.status === 'delivered').length.toString()]
      ],
      styles: { fontSize: 12, halign: 'left', cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });
    
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('Order Status Distribution', 180, doc.lastAutoTable.finalY + 15);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Status', 'Order Count']],
      body: statusData.map(entry => [entry.englishName, entry.value.toString()]),
      styles: { fontSize: 12, halign: 'left', cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });
    
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('Top Cities by Orders', 180, doc.lastAutoTable.finalY + 15);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['City', 'Order Count']],
      body: cityData.map(entry => [entry.city, entry.count.toString()]),
      styles: { fontSize: 12, halign: 'left', cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Generated by ELAMLI Order Management System', 105, 280, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(79, 70, 229);
    doc.line(20, 275, 190, 275);
    
    doc.save(`Statistics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header يحتوي على زر القائمة */}
      <Header pendingOrdersCount={0} />

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-4">
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">الإحصائيات والتحليلات</h2>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-600">النطاق الزمني:</span>
              <select
                className="block pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <option value="7days">آخر 7 أيام</option>
                <option value="30days">آخر 30 يوم</option>
                <option value="90days">آخر 90 يوم</option>
              </select>
              <button
                onClick={downloadReport}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Download className="h-5 w-5 mr-2" />
                تنزيل التقرير
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">الإيرادات عبر الزمن</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`$${value}`, 'الإيرادات']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="الإيرادات" 
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع حالات الطلبات</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'الطلبات']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Orders by City */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">أفضل المدن حسب الطلبات</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [value, 'الطلبات']} />
                    <Legend />
                    <Bar dataKey="count" name="الطلبات" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">الإحصائيات العامة</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-medium text-gray-500">إجمالي الطلبات</h4>
                  <p className="text-xl font-bold text-gray-900">{filteredOrders.length}</p>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-medium text-gray-500">إجمالي الإيرادات</h4>
                  <p className="text-xl font-bold text-gray-900">
                    ${filteredOrders.reduce((sum, order) => sum + (Number(order.productPrice) || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-medium text-gray-500">متوسط قيمة الطلب</h4>
                  <p className="text-xl font-bold text-gray-900">
                    ${filteredOrders.length > 0 
                      ? (filteredOrders.reduce((sum, order) => sum + (Number(order.productPrice) || 0), 0) / filteredOrders.length).toFixed(2) 
                      : '0.00'}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-500">الطلبات المكتملة</h4>
                  <p className="text-xl font-bold text-gray-900">
                    {filteredOrders.filter(order => order.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;