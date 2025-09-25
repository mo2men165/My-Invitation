// client/src/components/collaboration/CollaborationDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Target, 
  TrendingUp,
  UserPlus,
  Crown,
  Gem,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { collaborationAPI } from '@/lib/api/collaboration';
import { useToast } from '@/hooks/useToast';

interface CollaborationStats {
  eventsWithCollaborators: number;
  totalCollaboratorsManaged: number;
  eventsCollaboratedIn: number;
  totalGuestsAddedAsCollaborator: number;
  accountOrigin: 'self_registered' | 'collaborator_invited';
  invitedBy?: string;
}

export const CollaborationDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<CollaborationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await collaborationAPI.getCollaborationStats();
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الإحصائيات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  if (!stats) {
    return null;
  }

  const isCollaboratorInvited = stats.accountOrigin === 'collaborator_invited';

  return (
    <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C09B52]/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-[#C09B52]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">إحصائيات التعاون</h3>
            <p className="text-sm text-gray-400">
              {isCollaboratorInvited ? 'تم دعوتك كمتعاون' : 'عضو أساسي'}
            </p>
          </div>
        </div>

        {isCollaboratorInvited && (
          <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm border border-green-700/30">
            <UserPlus className="w-3 h-3 inline mr-1" />
            مدعو
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Events as Owner */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-6 h-6 text-[#C09B52]" />
            <span className="text-2xl font-bold text-white">{stats.eventsWithCollaborators}</span>
          </div>
          <p className="text-xs text-gray-400">مناسبات بمتعاونين</p>
        </div>

        {/* Collaborators Managed */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span className="text-2xl font-bold text-white">{stats.totalCollaboratorsManaged}</span>
          </div>
          <p className="text-xs text-gray-400">متعاونين تمت إدارتهم</p>
        </div>

        {/* Events Collaborated In */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-purple-400" />
            <span className="text-2xl font-bold text-white">{stats.eventsCollaboratedIn}</span>
          </div>
          <p className="text-xs text-gray-400">مناسبات شاركت فيها</p>
        </div>

        {/* Guests Added as Collaborator */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <span className="text-2xl font-bold text-white">{stats.totalGuestsAddedAsCollaborator}</span>
          </div>
          <p className="text-xs text-gray-400">ضيوف أضفتهم</p>
        </div>
      </div>

      {/* Account Origin Info */}
      {isCollaboratorInvited && (
        <div className="mt-6 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-green-400" />
            <div>
              <h4 className="text-green-400 font-medium">حساب متعاون</h4>
              <p className="text-green-300 text-sm">
                تم إنشاء حسابك عبر دعوة للتعاون في إدارة مناسبة. يمكنك الآن استخدام الحساب لإنشاء مناسباتك الخاصة أيضاً!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Benefits */}
      <div className="mt-6 p-4 bg-[#C09B52]/10 border border-[#C09B52]/30 rounded-xl">
        <h4 className="text-[#C09B52] font-medium mb-3">مميزات التعاون</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span>بريميوم: 2 متعاونين</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Gem className="w-4 h-4 text-purple-400" />
            <span>VIP: 10 متعاونين</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Target className="w-4 h-4 text-blue-400" />
            <span>تخصيص الدعوات</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="w-4 h-4 text-green-400" />
            <span>صلاحيات مرنة</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(stats.eventsWithCollaborators > 0 || stats.eventsCollaboratedIn > 0) && (
        <div className="mt-6 flex justify-center">
          <a
            href="/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#C09B52]/20 hover:bg-[#C09B52]/30 text-[#C09B52] rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            عرض جميع المناسبات
          </a>
        </div>
      )}
    </div>
  );
};
