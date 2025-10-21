'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Package,
  XCircle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';
import { AdminOrderDetailsModal } from './AdminOrderDetailsModal';

interface Order {
  id: string;
  merchantOrderId: string;
  paymobOrderId: number;
  paymobTransactionId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  itemsCount: number;
  eventsCreated: number;
  eventsDetails: Array<{
    id: string;
    name: string;
    approvalStatus: string;
  }>;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
}

interface OrderStats {
  pending: number;
  completed: number;
  failed: number;
  cancelled: number;
  totalRevenue: number;
}

interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    stats: OrderStats;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export function AdminOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    pending: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('فشل في جلب الطلبات');
      }

      const data: OrdersResponse = await response.json();
      
      if (data.success) {
        setOrders(data.data.orders);
        setStats(data.data.stats);
        setTotalPages(data.data.pagination.pages);
        setTotalOrders(data.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        icon: CheckCircle,
        label: 'مكتمل'
      },
      pending: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        icon: Clock,
        label: 'قيد الانتظار'
      },
      failed: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        icon: XCircle,
        label: 'فشل'
      },
      cancelled: {
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
        icon: Ban,
        label: 'ملغي'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4 ml-1" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      calendar: 'gregory',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">مكتمل</p>
          <p className="text-3xl font-bold text-white">{stats.completed}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">قيد الانتظار</p>
          <p className="text-3xl font-bold text-white">{stats.pending}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">فشل</p>
          <p className="text-3xl font-bold text-white">{stats.failed}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gray-500/20 rounded-lg">
              <Ban className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">ملغي</p>
          <p className="text-3xl font-bold text-white">{stats.cancelled}</p>
        </div>

        <div className="bg-gradient-to-br from-[#C09B52]/10 to-amber-600/10 border border-[#C09B52]/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-[#C09B52]/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-[#C09B52]" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">إجمالي الإيرادات</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          
          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث برقم الطلب..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#C09B52] transition-colors"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400 ml-2" />
            <button
              onClick={() => handleStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'completed'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              مكتمل
            </button>
            <button
              onClick={() => handleStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              قيد الانتظار
            </button>
            <button
              onClick={() => handleStatusFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'failed'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              فشل
            </button>
            <button
              onClick={() => handleStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'cancelled'
                  ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ملغي
            </button>
            {statusFilter && (
              <button
                onClick={() => handleStatusFilter('')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
              >
                إزالة التصفية
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C09B52]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">لا توجد طلبات</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      العناصر
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-[200px]">
                          <p className="text-white font-medium">#{order.paymobOrderId}</p>
                          <p className="text-gray-400 text-xs break-all">{order.merchantOrderId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-medium">{order.user.name}</p>
                          <p className="text-gray-400 text-xs">{order.user.email}</p>
                          <p className="text-gray-500 text-xs">{order.user.city}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-white font-bold">{formatCurrency(order.totalAmount)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <p className="text-white">{order.itemsCount} عنصر</p>
                          <p className="text-gray-400 text-xs">{order.eventsCreated} حدث</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="text-[#C09B52] hover:text-amber-400 font-medium text-sm transition-colors"
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="text-sm text-gray-400">
                عرض {orders.length} من {totalOrders} طلب
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#C09B52] text-black'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrderId && (
        <AdminOrderDetailsModal
          orderId={selectedOrderId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrderId(null);
            fetchOrders(); // Refresh list after closing modal (in case status changed)
          }}
        />
      )}
    </div>
  );
}

