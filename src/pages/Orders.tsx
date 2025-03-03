import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { database } from '../firebase/config';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { Search, Filter, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import Header from '../components/Header';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { Order } from '../types';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

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
          
          ordersArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setOrders(ordersArray);
          setFilteredOrders(ordersArray);
        } else {
          setOrders([]);
          setFilteredOrders([]);
        }
      } catch (error) {
        console.error('خطأ في جلب الطلبات:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    
    if (searchTerm) {
      result = result.filter(order => 
        (order.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orders]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, { status: newStatus });
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
    }
  };

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

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
        <div className="mt-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">إدارة الطلبات</h2>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right"
                  placeholder="البحث في الطلبات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">كل الحالات</option>
                  <option value="pending">معلق</option>
                  <option value="processing">قيد المعالجة</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>
            </div>
            
            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تفاصيل الطلب
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <img 
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-cover" 
                              src={order.imageUrl || 'https://via.placeholder.com/48'} 
                              alt={order.productName || 'منتج'} 
                            />
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{order.productName || 'غير معروف'}</div>
                            <div className="text-sm text-gray-500">${order.productPrice || '0.00'}</div>
                            <div className="text-xs text-gray-500">رقم: {order.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{order.fullName || 'غير محدد'}</div>
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
                        <div className="text-sm text-gray-500">
                          {order.city || 'غير محدد'}، {order.address || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {order.createdAt 
                          ? format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: ar })
                          : 'غير متوفر'}
                        <div className="text-xs">
                          {order.createdAt 
                            ? format(new Date(order.createdAt), 'HH:mm')
                            : 'غير متوفر'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right">
                        <OrderStatusBadge status={order.status || 'pending'} />
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                        <select
                          className="block w-full pr-3 pl-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right"
                          value={order.status || 'pending'}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        >
                          <option value="pending">معلق</option>
                          <option value="processing">قيد المعالجة</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">ملغى</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  
                  {currentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        لا توجد طلبات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 flex-col sm:flex-row gap-4 sm:gap-0">
                <div className="text-sm text-gray-700 text-center sm:text-right">
                  عرض <span className="font-medium">{indexOfFirstOrder + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(indexOfLastOrder, filteredOrders.length)}</span>{' '}
                  من <span className="font-medium">{filteredOrders.length}</span> نتيجة
                </div>
                <div className="flex items-center justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px space-x-reverse" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">السابق</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">التالي</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;