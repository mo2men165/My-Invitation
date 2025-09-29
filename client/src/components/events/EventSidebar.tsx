import React from 'react';
import { 
  Send, 
  ExternalLink,
  Users2
} from 'lucide-react';

interface EventSidebarProps {
  guestStats?: {
    totalGuests: number;
    totalInvited: number;
    whatsappMessagesSent: number;
    remainingInvites: number;
  } | null;
  event: {
    details: {
      eventName?: string;
      inviteCount: number;
      eventDate: string;
      additionalCards: number;
      gateSupervisors?: string;
      fastDelivery: boolean;
    };
    approvalStatus: string;
    invitationCardUrl?: string;
    qrCodeUrl?: string;
    paymentCompletedAt: string;
  };
  approvalStatusDetails: {
    name: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  formatEventDate: (dateString: string) => string;
}

export const EventSidebar: React.FC<EventSidebarProps> = ({
  guestStats,
  event,
  approvalStatusDetails,
  formatEventDate
}) => {
  const ApprovalIcon = approvalStatusDetails.icon;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">إحصائيات المناسبة</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">إجمالي الضيوف</span>
            <span className="text-white font-semibold">{guestStats?.totalGuests || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">إجمالي المدعوين</span>
            <span className="text-white font-semibold">{guestStats?.totalInvited || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">رسائل واتساب</span>
            <span className="text-green-400 font-semibold">{guestStats?.whatsappMessagesSent || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">دعوات متبقية</span>
            <span className="text-[#C09B52] font-semibold">{guestStats?.remainingInvites || 0}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>التقدم</span>
            <span>{Math.round(((guestStats?.totalInvited || 0) / event.details.inviteCount) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#C09B52] to-[#B8935A] h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(((guestStats?.totalInvited || 0) / event.details.inviteCount) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Approval Status Info */}
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">حالة الموافقة</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">الحالة</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${approvalStatusDetails.bgColor} ${approvalStatusDetails.color} flex items-center gap-2`}>
              <ApprovalIcon className="w-4 h-4" />
              {approvalStatusDetails.name}
            </div>
          </div>
          
          {event.approvalStatus === 'approved' && event.invitationCardUrl && (
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">بطاقة الدعوة</span>
                <a
                  href={event.invitationCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  متوفرة
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">الجدول الزمني</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <div className="text-white font-medium">تم إتمام الدفع</div>
              <div className="text-gray-400">
                {new Date(event.paymentCompletedAt).toLocaleDateString('ar-SA', {
                  calendar: 'gregory'
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="w-3 h-3 bg-[#C09B52] rounded-full"></div>
            <div>
              <div className="text-white font-medium">تاريخ المناسبة</div>
              <div className="text-gray-400">
                {formatEventDate(event.details.eventDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Management Info */}
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">إدارة الضيوف</h3>
        
        <div className="space-y-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-400">
              <Send className="w-4 h-4" />
              <span className="font-medium">إرسال شخصي</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              يمكنك إرسال الدعوات للضيوف مباشرة عبر واتساب. ستتضمن الرسائل رابط الدعوة تلقائياً
            </p>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      {(event.details.additionalCards > 0 || event.details.gateSupervisors || event.details.fastDelivery) && (
        <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">الخدمات الإضافية</h3>
          
          <div className="space-y-3 text-sm">
            {event.details.additionalCards > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-300">كروت إضافية</span>
                <span className="text-white">{event.details.additionalCards}</span>
              </div>
            )}
            
            {event.details.gateSupervisors && (
              <div className="flex justify-between">
                <span className="text-gray-300">مشرفين البوابة</span>
                <span className="text-white text-xs">{event.details.gateSupervisors}</span>
              </div>
            )}
            
            {event.details.fastDelivery && (
              <div className="flex justify-between">
                <span className="text-gray-300">تسريع التنفيذ</span>
                <span className="text-green-400">مُفعل</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
