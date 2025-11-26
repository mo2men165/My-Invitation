'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Users, Search, UserCheck, UserX, Shield, User, RefreshCw, ShoppingCart } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { AdminUserCart } from '@/components/admin/AdminUserCart';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  customCity?: string;
  role: string;
  status: string;
  eventCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewingCart, setViewingCart] = useState<{ userId: string; userName: string; userEmail: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchUsers();
    }
  }, [mounted, isAuthenticated, currentPage, searchTerm, roleFilter, statusFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!mounted || !isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUsers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [mounted, isAuthenticated]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getUsers({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });
      setUsers(data.data);
      setTotalPages(data.pagination.pages);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ في جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'suspended') => {
    setProcessing(prev => [...prev, userId]);
    try {
      await adminAPI.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      setSuccessMessage(`تم ${newStatus === 'active' ? 'تفعيل' : 'تعليق'} الحساب بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error instanceof Error ? error.message : 'فشل في تحديث حالة المستخدم');
    } finally {
      setProcessing(prev => prev.filter(id => id !== userId));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin') => {
    setProcessing(prev => [...prev, userId]);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setSuccessMessage(`تم تغيير الدور إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم'} بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error instanceof Error ? error.message : 'فشل في تحديث دور المستخدم');
    } finally {
      setProcessing(prev => prev.filter(id => id !== userId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    
    // Check if text contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    if (hasArabic) {
      // For Arabic text, truncate from the end (keep the beginning)
      return text.substring(0, maxLength - 3) + '...';
    } else {
      // For English text, truncate from the end (keep the beginning)
      return text.substring(0, maxLength - 3) + '...';
    }
  };

  if (!mounted || isLoading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">جاري التحميل...</div>
        </div>
      </AdminSidebar>
    );
  }

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <AdminSidebar>
      <div className="container mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-[#C09B52] ml-3" />
              <h1 className="text-3xl font-bold text-white">إدارة المستخدمين</h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-5 py-2.5 bg-[#C09B52] hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </button>
              <div className="text-sm text-gray-400 text-right">
                <div className="font-medium">آخر تحديث:</div>
                <div className="text-xs">{lastRefresh.toLocaleTimeString('ar-SA')}</div>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-right">إدارة وتتبع جميع المستخدمين المسجلين في المنصة</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم، الإيميل، أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] text-right"
                dir="rtl"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] text-right"
              dir="rtl"
            >
              <option value="">جميع الأدوار</option>
              <option value="user">مستخدم</option>
              <option value="admin">مدير</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] text-right"
              dir="rtl"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="suspended">معلق</option>
            </select>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-green-400">
              <UserCheck className="w-5 h-5" />
              <span className="font-medium">تم بنجاح</span>
            </div>
            <p className="text-green-300 mt-2">{successMessage}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-red-400">
              <UserX className="w-5 h-5" />
              <span className="font-medium">خطأ في تحميل البيانات</span>
            </div>
            <p className="text-red-300 mt-2">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-900/60 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#C09B52] border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-white">جاري تحميل المستخدمين...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">لا توجد مستخدمين</p>
              {searchTerm || roleFilter || statusFilter ? (
                <p className="text-gray-500 text-sm mt-2">جرب تغيير الفلاتر للعثور على المزيد من النتائج</p>
              ) : null}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
                <div className="grid grid-cols-6 gap-6 text-sm font-medium text-gray-400">
                  <div className="text-right">المستخدم</div>
                  <div className="text-right">الإيميل</div>
                  <div className="text-right">الهاتف</div>
                  <div className="text-center">الدور</div>
                  <div className="text-center">الحالة</div>
                  <div className="text-center">الإجراءات</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-700">
                {users.map((user) => (
                  <div key={user.id} className="px-6 py-5 hover:bg-gray-800/30 transition-colors duration-200">
                    <div className="grid grid-cols-6 gap-6 items-center">
                      {/* User Info */}
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0 ml-3">
                          <span className="text-sm font-bold text-black">
                            {user.firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div 
                            className="text-white font-medium text-sm" 
                            style={{ 
                              textAlign: 'right',
                              direction: 'rtl'
                            }}
                            title={`${user.firstName} ${user.lastName}`}
                          >
                            {truncateText(`${user.firstName} ${user.lastName}`, 25)}
                          </div>
                          <div 
                            className="text-gray-400 text-xs mt-1" 
                            style={{ 
                              textAlign: 'right',
                              direction: 'rtl'
                            }}
                          >
                            {truncateText(`${user.city === 'اخري' && user.customCity ? user.customCity : user.city} • ${user.eventCount} حدث`, 30)}
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="text-gray-300 text-sm text-right min-w-0">
                        <div className="truncate" dir="ltr" title={user.email}>
                          {user.email}
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="text-gray-300 text-sm text-right">
                        <div className="font-mono" dir="ltr">
                          {user.phone}
                        </div>
                      </div>

                      {/* Role */}
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-900/30 text-purple-400 border border-purple-700' 
                            : 'bg-blue-900/30 text-blue-400 border border-blue-700'
                        }`}>
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 ml-1" />
                              مدير
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 ml-1" />
                              مستخدم
                            </>
                          )}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-900/30 text-green-400 border border-green-700' 
                            : 'bg-red-900/30 text-red-400 border border-red-700'
                        }`}>
                          {user.status === 'active' ? (
                            <>
                              <UserCheck className="w-3 h-3 ml-1" />
                              نشط
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 ml-1" />
                              معلق
                            </>
                          )}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-3">
                        {/* View Cart Button */}
                        <button
                          onClick={() => setViewingCart({
                            userId: user.id,
                            userName: `${user.firstName} ${user.lastName}`,
                            userEmail: user.email
                          })}
                          className="p-2.5 rounded-lg bg-[#C09B52] hover:bg-amber-600 text-white transition-colors duration-200"
                          title="عرض السلة"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <>
                            {/* Status Toggle */}
                            <button
                              onClick={() => handleUpdateStatus(
                                user.id, 
                                user.status === 'active' ? 'suspended' : 'active'
                              )}
                              disabled={processing.includes(user.id)}
                              className={`p-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                                user.status === 'active'
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              title={user.status === 'active' ? 'تعليق' : 'تفعيل'}
                            >
                              {user.status === 'active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>

                            {/* Role Toggle */}
                            <button
                              onClick={() => handleUpdateRole(
                                user.id, 
                                user.role === 'user' ? 'admin' : 'user'
                              )}
                              disabled={processing.includes(user.id)}
                              className={`p-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                                user.role === 'user'
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                              title={user.role === 'user' ? 'ترقية لمدير' : 'تحويل لمستخدم'}
                            >
                              {user.role === 'user' ? (
                                <Shield className="w-4 h-4" />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400 text-right">
                      صفحة {currentPage} من {totalPages}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 font-medium"
                      >
                        السابق
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 font-medium"
                      >
                        التالي
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Cart Modal */}
      {viewingCart && (
        <AdminUserCart
          userId={viewingCart.userId}
          userName={viewingCart.userName}
          userEmail={viewingCart.userEmail}
          onClose={() => setViewingCart(null)}
        />
      )}
    </AdminSidebar>
  );
}