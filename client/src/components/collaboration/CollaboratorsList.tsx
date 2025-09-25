// client/src/components/collaboration/CollaboratorsList.tsx
'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  Settings, 
  Trash2, 
  UserCheck, 
  UserX,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Plus,
  Loader2
} from 'lucide-react';
import { Collaborator } from '@/lib/api/collaboration';
import { useToast } from '@/hooks/useToast';

interface CollaboratorsListProps {
  collaborators: Collaborator[];
  loading: boolean;
  onUpdateCollaborator: (collaboratorId: string, updates: any) => Promise<void>;
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
  packageType: 'premium' | 'vip';
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({
  collaborators,
  loading,
  onUpdateCollaborator,
  onRemoveCollaborator,
  packageType
}) => {
  const { toast } = useToast();
  const [editingCollaborator, setEditingCollaborator] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleEditStart = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator.id);
    setEditFormData({
      allocatedInvites: collaborator.allocatedInvites,
      permissions: { ...collaborator.permissions }
    });
  };

  const handleEditSave = async (collaboratorId: string) => {
    setActionLoading(collaboratorId);
    try {
      await onUpdateCollaborator(collaboratorId, editFormData);
      setEditingCollaborator(null);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المتعاون",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCancel = () => {
    setEditingCollaborator(null);
    setEditFormData({});
  };

  const handleRemove = async (collaborator: Collaborator) => {
    if (!confirm(`هل أنت متأكد من إزالة ${collaborator.name} من المتعاونين؟`)) {
      return;
    }

    setActionLoading(collaborator.id);
    try {
      await onRemoveCollaborator(collaborator.id);
      toast({
        title: "تم الحذف بنجاح",
        description: `تم إزالة ${collaborator.name} من المتعاونين`,
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const getUsagePercentage = (used: number, allocated: number) => {
    return allocated > 0 ? Math.round((used / allocated) * 100) : 0;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400 bg-red-900/20';
    if (percentage >= 70) return 'text-yellow-400 bg-yellow-900/20';
    return 'text-green-400 bg-green-900/20';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-[#C09B52]" />
        </div>
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-[#C09B52]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#C09B52]" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">لا يوجد متعاونون</h3>
          <p className="text-gray-400 text-sm">
            أضف متعاونين للمساعدة في إدارة قائمة الضيوف
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C09B52]/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-[#C09B52]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">المتعاونون</h3>
            <p className="text-sm text-gray-400">{collaborators.length} متعاون نشط</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {collaborators.map((collaborator) => {
          const isEditing = editingCollaborator === collaborator.id;
          const isActionLoading = actionLoading === collaborator.id;
          const usagePercentage = getUsagePercentage(collaborator.usedInvites, collaborator.allocatedInvites);
          const usageColorClass = getUsageColor(usagePercentage);

          return (
            <div
              key={collaborator.id}
              className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#C09B52] to-[#B8935A] rounded-full flex items-center justify-center text-white font-medium">
                    {collaborator.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2">
                      {collaborator.name}
                      {collaborator.isNewUser && (
                        <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-700/30">
                          حساب جديد
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-3 h-3" />
                      {collaborator.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => handleEditStart(collaborator)}
                        disabled={isActionLoading}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Settings className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleRemove(collaborator)}
                        disabled={isActionLoading}
                        className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
                        title="إزالة"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditSave(collaborator.id)}
                        disabled={isActionLoading}
                        className="p-2 bg-green-900/30 hover:bg-green-900/50 rounded-lg transition-colors"
                        title="حفظ"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={isActionLoading}
                        className="p-2 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg transition-colors"
                        title="إلغاء"
                      >
                        <XCircle className="w-4 h-4 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">الدعوات المستخدمة</p>
                      <p className="text-lg font-bold text-white">
                        {collaborator.usedInvites} / {collaborator.allocatedInvites}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${usageColorClass}`}>
                      {usagePercentage}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-[#C09B52] to-[#B8935A] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-xs text-gray-400">تاريخ الإضافة</p>
                  <p className="text-sm font-medium text-white flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(collaborator.addedAt)}
                  </p>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-300">الصلاحيات:</h5>
                
                {isEditing ? (
                  <div className="space-y-2">
                    {/* Edit Allocated Invites */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-300 w-32">عدد الدعوات:</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={editFormData.allocatedInvites || 0}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          allocatedInvites: parseInt(e.target.value)
                        })}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#C09B52]"
                      />
                    </div>

                    {/* Edit Permissions */}
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editFormData.permissions?.canAddGuests || false}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            permissions: {
                              ...editFormData.permissions,
                              canAddGuests: e.target.checked
                            }
                          })}
                          className="w-3 h-3 text-[#C09B52] bg-white/10 border-white/20 rounded focus:ring-[#C09B52]"
                        />
                        <Plus className="w-3 h-3 text-green-400" />
                        <span className="text-gray-300">إضافة</span>
                      </label>

                      {packageType === 'vip' && (
                        <>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editFormData.permissions?.canEditGuests || false}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                permissions: {
                                  ...editFormData.permissions,
                                  canEditGuests: e.target.checked
                                }
                              })}
                              className="w-3 h-3 text-[#C09B52] bg-white/10 border-white/20 rounded focus:ring-[#C09B52]"
                            />
                            <Edit className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-300">تعديل</span>
                          </label>

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editFormData.permissions?.canDeleteGuests || false}
                              onChange={(e) => setEditFormData({
                                ...editFormData,
                                permissions: {
                                  ...editFormData.permissions,
                                  canDeleteGuests: e.target.checked
                                }
                              })}
                              className="w-3 h-3 text-[#C09B52] bg-white/10 border-white/20 rounded focus:ring-[#C09B52]"
                            />
                            <Trash2 className="w-3 h-3 text-red-400" />
                            <span className="text-gray-300">حذف</span>
                          </label>
                        </>
                      )}

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editFormData.permissions?.canViewFullEvent || false}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            permissions: {
                              ...editFormData.permissions,
                              canViewFullEvent: e.target.checked
                            }
                          })}
                          className="w-3 h-3 text-[#C09B52] bg-white/10 border-white/20 rounded focus:ring-[#C09B52]"
                        />
                        <Eye className="w-3 h-3 text-purple-400" />
                        <span className="text-gray-300">عرض كامل</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {collaborator.permissions.canAddGuests && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                        <Plus className="w-3 h-3" />
                        إضافة
                      </div>
                    )}
                    {collaborator.permissions.canEditGuests && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">
                        <Edit className="w-3 h-3" />
                        تعديل
                      </div>
                    )}
                    {collaborator.permissions.canDeleteGuests && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs">
                        <Trash2 className="w-3 h-3" />
                        حذف
                      </div>
                    )}
                    {collaborator.permissions.canViewFullEvent && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs">
                        <Eye className="w-3 h-3" />
                        عرض كامل
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
