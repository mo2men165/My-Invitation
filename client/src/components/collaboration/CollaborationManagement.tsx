// client/src/components/collaboration/CollaborationManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Target, 
  TrendingUp,
  AlertCircle,
  Info,
  Loader2,
  Crown,
  Gem
} from 'lucide-react';
import { collaborationAPI, Collaborator } from '@/lib/api/collaboration';
import { AddCollaboratorModal } from './AddCollaboratorModal';
import { CollaboratorsList } from './CollaboratorsList';
import { useToast } from '@/hooks/useToast';

interface CollaborationManagementProps {
  eventId: string;
  packageType: 'classic' | 'premium' | 'vip';
  totalInvites: number;
}

export const CollaborationManagement: React.FC<CollaborationManagementProps> = ({
  eventId,
  packageType,
  totalInvites
}) => {
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [totalAllocatedInvites, setTotalAllocatedInvites] = useState(0);
  const [maxAllocation, setMaxAllocation] = useState(0);

  // Package limits - removed allocation percentage restrictions
  const packageLimits = {
    classic: { maxCollaborators: 0, maxAllocationPercent: 1.0 },
    premium: { maxCollaborators: 2, maxAllocationPercent: 1.0 },
    vip: { maxCollaborators: 10, maxAllocationPercent: 1.0 }
  };

  const currentLimit = packageLimits[packageType];
  const maxAllocationCalculated = Math.floor(totalInvites * currentLimit.maxAllocationPercent);

  useEffect(() => {
    loadCollaborators();
  }, [eventId]);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const response = await collaborationAPI.getCollaborators(eventId);
      
      if (response.success) {
        setCollaborators(response.collaborators || []);
        setTotalAllocatedInvites(response.totalAllocatedInvites || 0);
        setMaxAllocation(response.maxAllocation || maxAllocationCalculated);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المتعاونين",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    await loadCollaborators();
  };

  const handleUpdateCollaborator = async (collaboratorId: string, updates: any) => {
    await collaborationAPI.updateCollaborator(eventId, collaboratorId, updates);
    await loadCollaborators();
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    await collaborationAPI.removeCollaborator(eventId, collaboratorId);
    await loadCollaborators();
  };

  // Don't show for classic package
  if (packageType === 'classic') {
    return (
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">ترقية مطلوبة</h3>
          <p className="text-gray-400 text-sm mb-4">
            ميزة المتعاونين متاحة فقط للحزم البريميوم و VIP
          </p>
          <div className="flex justify-center gap-3">
            <div className="px-4 py-2 bg-yellow-900/20 text-yellow-400 rounded-lg text-sm border border-yellow-700/30">
              <Crown className="w-4 h-4 inline mr-2" />
              بريميوم: حتى 2 متعاونين
            </div>
            <div className="px-4 py-2 bg-purple-900/20 text-purple-400 rounded-lg text-sm border border-purple-700/30">
              <Gem className="w-4 h-4 inline mr-2" />
              VIP: حتى 10 متعاونين
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canAddMore = collaborators.length < currentLimit.maxCollaborators;
  const allocationPercentage = maxAllocation > 0 ? Math.round((totalAllocatedInvites / maxAllocation) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl p-0.5 ${
              packageType === 'vip' 
                ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                : 'bg-gradient-to-br from-[#C09B52] to-amber-500'
            }`}>
              <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                {packageType === 'vip' ? (
                  <Gem className="w-6 h-6 text-white" />
                ) : (
                  <Crown className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إدارة المتعاونين</h2>
              <p className="text-gray-400 text-sm">
                حزمة {packageType === 'vip' ? 'VIP' : 'بريميوم'} • 
                حتى {currentLimit.maxCollaborators} متعاونين
              </p>
            </div>
          </div>

          {canAddMore && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C09B52] to-[#B8935A] hover:from-[#B8935A] hover:to-[#A67C52] text-white font-medium rounded-lg transition-all"
            >
              <UserPlus className="w-5 h-5" />
              إضافة متعاون
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">المتعاونون النشطون</p>
                <p className="text-2xl font-bold text-white">{collaborators.length}</p>
              </div>
              <Users className="w-8 h-8 text-[#C09B52]" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#C09B52] to-[#B8935A] h-2 rounded-full transition-all"
                  style={{ width: `${(collaborators.length / currentLimit.maxCollaborators) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {currentLimit.maxCollaborators - collaborators.length} متبقي
              </p>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">الدعوات المخصصة</p>
                <p className="text-2xl font-bold text-white">{totalAllocatedInvites}</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {maxAllocation - totalAllocatedInvites} متبقي للتخصيص
              </p>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">الدعوات المستخدمة</p>
                <p className="text-2xl font-bold text-white">
                  {collaborators.reduce((sum, c) => sum + c.usedInvites, 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              من قبل المتعاونين
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">معدل الاستخدام</p>
                <p className="text-2xl font-bold text-white">
                  {totalAllocatedInvites > 0 
                    ? Math.round((collaborators.reduce((sum, c) => sum + c.usedInvites, 0) / totalAllocatedInvites) * 100)
                    : 0
                  }%
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                allocationPercentage >= 80 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
              }`}>
                {allocationPercentage >= 80 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              كفاءة الاستخدام
            </p>
          </div>
        </div>

        {/* Allocation Warning */}
        {allocationPercentage >= 90 && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <h4 className="text-red-400 font-medium">تحذير: نفاد التخصيص</h4>
                <p className="text-red-300 text-sm">
                  لقد تم تخصيص {allocationPercentage}% من الدعوات المتاحة للمتعاونين
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Package Info */}
        <div className={`mt-4 p-4 rounded-xl border ${
          packageType === 'vip' 
            ? 'bg-purple-900/20 border-purple-700/30' 
            : 'bg-yellow-900/20 border-yellow-700/30'
        }`}>
          <div className="flex items-center gap-3">
            <Info className={`w-5 h-5 ${packageType === 'vip' ? 'text-purple-400' : 'text-yellow-400'}`} />
            <div>
              <h4 className={`font-medium ${packageType === 'vip' ? 'text-purple-400' : 'text-yellow-400'}`}>
                مميزات حزمة {packageType === 'vip' ? 'VIP' : 'البريميوم'}
              </h4>
              <p className="text-sm text-gray-300">
                {packageType === 'vip' 
                  ? 'حتى 10 متعاونين • تخصيص حتى 100% من الدعوات • صلاحيات متقدمة'
                  : 'حتى 2 متعاونين • تخصيص حتى 100% من الدعوات • صلاحيات أساسية'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collaborators List */}
      <CollaboratorsList
        collaborators={collaborators}
        loading={loading}
        onUpdateCollaborator={handleUpdateCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        packageType={packageType as 'premium' | 'vip'}
      />

      {/* Add Collaborator Modal */}
      <AddCollaboratorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        eventId={eventId}
        packageType={packageType as 'premium' | 'vip'}
        maxAllocation={maxAllocation}
        currentAllocated={totalAllocatedInvites}
        onSuccess={handleAddCollaborator}
      />
    </div>
  );
};
