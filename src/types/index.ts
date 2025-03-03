export interface Order {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
}