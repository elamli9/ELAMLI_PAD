import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Clock,
  ChevronLeft,
  Phone
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { Order, DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);
        
        if (snapshot.exists()) {
          const ordersData = snapshot.val();
          const orders: Order[] = Object.keys(ordersData).map(key => ({
            id: key,
            ...ordersData[key]
          }));
          
          const totalOrders = orders.length;
          const pendingOrders = orders.filter(order => 
            order.status === 'pending' || order.status === 'processing'
          ).length;
          const completedOrders = orders.filter(order => 
            order.status === 'delivered'
          ).length;
          const totalRevenue = orders.reduce((sum, order) => 
            sum + (Number(order.productPrice) || 0), 0
          );
          
          const recentOrders = [...orders]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 5);
          
          setStats({
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue,
            recentOrders
          });
        }
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        setError('حدث خطأ أثناء تحميل البيانات. حاول مرة أخرى لاحقاً.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const chartData = [
    { name: 'يناير', orders: 65 },
    { name: 'فبراير', orders: 59 },
    { name: 'مارس', orders: 80 },
    { name: 'أبريل', orders: 81 },
    { name: 'مايو', orders: 56 },
    { name: 'يونيو', orders: 55 },
    { name: 'يوليو', orders: 40 },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

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
      <Header pendingOrdersCount={stats.pendingOrders} />

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-4 space-y-4 sm:space-y-0">
          <StatCard 
            title="إجمالي الطلبات" 
            value={stats.totalOrders} 
            icon={ShoppingBag} 
            color="bg-indigo-600"
            percentChange={12}
          />
          <StatCard 
            title="إجمالي الإيرادات" 
            value={`$${typeof stats.totalRevenue === 'number' ? stats.totalRevenue.toFixed(2) : '0.00'}`} 
            icon={DollarSign} 
            color="bg-green-600"
            percentChange={8}
          />
          <StatCard 
            title="الطلبات المعلقة" 
            value={stats.pendingOrders} 
            icon={Clock} 
            color="bg-yellow-600"
            percentChange={-5}
          />
          <StatCard 
            title="الطلبات المكتملة" 
            value={stats.completedOrders} 
            icon={TrendingUp} 
            color="bg-purple-600"
            percentChange={15}
          />
        </div>
        
        <div className="mt-6 space-y-6">
          {/* Chart */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">نظرة عامة على الطلبات</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">الطلبات الأخيرة</h3>
              <a href="/orders" className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center">
                عرض الكل <ChevronLeft className="h-4 w-4 mr-1" />
              </a>
            </div>
            
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="border-b pb-4 last:border-b-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <img 
                      className="h-10 w-10 rounded-md object-cover flex-shrink-0" 
                      src={order.imageUrl || 'https://via.placeholder.com/40'} 
                      alt={order.productName || 'منتج'} 
                    />
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{order.productName || 'غير معروف'}</div>
                      <div className="text-sm text-gray-500">${order.productPrice || '0.00'}</div>
                      <div className="text-xs text-gray-400">رقم: {order.id.slice(0, 8)}</div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 sm:flex-1 text-right">
                    <div className="text-sm text-gray-900">{order.fullName || 'غير محدد'}</div>
                    <div className="text-sm text-gray-500 flex items-center justify-end space-x-2 space-x-reverse">
                      <span>{order.phone || 'غير متوفر'}</span>
                      {order.phone && (
                        <a
                          href={`tel:${order.phone}`}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="اتصال بالعميل"
                        >
                          <Phone className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{order.city || 'غير محدد'}</div>
                  </div>
                  <div className="mt-2 sm:mt-0 text-right">
                    <div className="text-sm text-gray-500">
                      {order.createdAt 
                        ? format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: ar })
                        : 'غير متوفر'}
                    </div>
                    <div className="mt-1">
                      <OrderStatusBadge status={order.status || 'pending'} />
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.recentOrders.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-4">
                  لا توجد طلبات
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;