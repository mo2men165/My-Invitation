import React from 'react';
import { 
  Send, 
  ExternalLink
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
      gateSupervisors?: number;
      fastDelivery: boolean;
    };
    approvalStatus: string;
    packageType: 'classic' | 'premium' | 'vip';
    invitationCardUrl?: string;
    qrCodeReaderUrl?: string;
    paymentCompletedAt?: string; // Make optional since it's filtered for collaborators
    refundableSlots?: {
      total: number;
      used: number;
    };
  };
  totalInvitesForView: number; // Total invites to show (allocated for collaborators)
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
  totalInvitesForView,
  approvalStatusDetails,
  formatEventDate
}) => {
  const ApprovalIcon = approvalStatusDetails.icon;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-gradient-to-br from-[#C09B52]/10 via-[#C09B52]/5 to-transparent rounded-2xl border border-[#C09B52]/20 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4">إحصائيات المناسبة</h3>
        
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
        
        {/* Refundable Slots Info - Only for Premium and VIP */}
        {(event.packageType === 'premium' || event.packageType === 'vip') && event.refundableSlots && event.refundableSlots.total > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-sm">أماكن قابلة للاسترجاع</span>
              <span className="text-amber-400 font-semibold text-sm">
                {event.refundableSlots.total - event.refundableSlots.used} / {event.refundableSlots.total}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((event.refundableSlots.used / event.refundableSlots.total) * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-gray-400 text-xs mt-2">
              عند اعتذار الضيوف، سيتم إرجاع الأماكن تلقائياً إذا كانت متاحة
            </p>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>التقدم</span>
            <span>{Math.round(((guestStats?.totalInvited || 0) / totalInvitesForView) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#C09B52] to-[#B8935A] h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(((guestStats?.totalInvited || 0) / totalInvitesForView) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Approval Status Info */}
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4">حالة الموافقة</h3>
        
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
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4">الجدول الزمني</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <div className="text-white font-medium">تم إتمام الدفع</div>
              <div className="text-gray-400">
                {event.paymentCompletedAt ? 
                  new Date(event.paymentCompletedAt).toLocaleDateString('ar-SA', {
                    calendar: 'gregory'
                  }) : 
                  'غير متاح'
                }
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
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-4">إدارة الضيوف</h3>
        
        <div className="space-y-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-400">
              <Send className="w-4 h-4" />
              <span className="font-medium">طريقة إرسال الدعوات</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              {event.packageType === 'classic' && (
                'قم بإدخال تفاصيل ضيوفك في قائمة الضيوف، ثم قم بتأكيد القائمة لإتمامها. بعد التأكيد، سنقوم بإرسال جميع الدعوات عبر الواتساب إليك، ويمكنك توزيعها على الضيوف بالطريقة المناسبة لك'
              )}
              {event.packageType === 'premium' && (
                'قم بإدخال تفاصيل ضيوفك في قائمة الضيوف، وسيقوم الإداريون بتوفير روابط فردية لكل ضيف. يمكنك بعدها إرسال الدعوات بسهولة من خلال الموقع باستخدام بوت الواتساب الآلي الخاص بنا'
              )}
              {event.packageType === 'vip' && (
                'قم فقط بتوفير تفاصيل ضيوفك وتأكيد قائمة الضيوف، وسنتولى نحن إرسال الدعوات لهم بشكل كامل'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      {(event.details.additionalCards > 0 || event.details.gateSupervisors || event.details.fastDelivery) && (
        <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-white mb-4">الخدمات الإضافية</h3>
          
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
