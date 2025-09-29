import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Package,
  QrCode,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

interface EventDetailsProps {
  event: {
    details: {
      eventName?: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      eventLocation: string;
      inviteCount: number;
      invitationText: string;
      qrCode: boolean;
    };
    totalPrice?: number; // Make optional since it's filtered for collaborators
    adminNotes?: string;
    invitationCardUrl?: string;
    qrCodeUrl?: string;
  };
  guestStats?: {
    totalInvited: number;
  } | null;
  totalInvitesForView: number; // Total invites to show (allocated for collaborators)
  formatEventDate: (dateString: string) => string;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  guestStats,
  totalInvitesForView,
  formatEventDate
}) => {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white mb-6">تفاصيل المناسبة</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {event.details.eventName && (
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#C09B52]" />
                <div>
                  <div className="text-white font-medium">اسم المناسبة</div>
                  <div className="text-gray-300 text-sm">
                    {event.details.eventName}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#C09B52]" />
              <div>
                <div className="text-white font-medium">التاريخ</div>
                <div className="text-gray-300 text-sm">
                  {formatEventDate(event.details.eventDate)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#C09B52]" />
              <div>
                <div className="text-white font-medium">الوقت</div>
                <div className="text-gray-300 text-sm">
                  من {event.details.startTime} إلى {event.details.endTime}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#C09B52]" />
              <div>
                <div className="text-white font-medium">المكان</div>
                <div className="text-gray-300 text-sm">{event.details.eventLocation}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#C09B52]" />
              <div>
                <div className="text-white font-medium">عدد الدعوات</div>
                <div className="text-gray-300 text-sm">
                  {guestStats?.totalInvited || 0} من {totalInvitesForView} دعوة
                </div>
              </div>
            </div>
            
            {event.details.qrCode && (
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-[#C09B52]" />
                <div>
                  <div className="text-white font-medium">كود QR</div>
                  <div className="text-gray-300 text-sm">مُفعل للدعوة</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[#C09B52]" />
              <div>
                <div className="text-white font-medium">السعر الإجمالي</div>
                <div className="text-[#C09B52] text-lg font-bold">
                  {event.totalPrice ? `${event.totalPrice.toLocaleString('ar-SA')} ر.س` : 'غير متاح'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Text */}
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">نص الدعوة</h3>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-gray-300 leading-relaxed">{event.details.invitationText}</p>
        </div>
      </div>

      {/* Admin Notes */}
      {event.adminNotes && event.adminNotes.trim() && (
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-2xl border border-red-700/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">ملاحظات الإدارة</h3>
          </div>
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
            <p className="text-red-100 leading-relaxed">{event.adminNotes}</p>
          </div>
        </div>
      )}

      {/* Invitation Card URL */}
      {event.invitationCardUrl && (
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-2xl border border-blue-700/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">بطاقة الدعوة</h3>
          </div>
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 max-w-xs">
                <p className="text-blue-100 text-sm mb-2">رابط بطاقة الدعوة:</p>
                <a
                  href={event.invitationCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-sm block truncate text-left"
                  title={event.invitationCardUrl}
                  dir="ltr"
                >
                  {event.invitationCardUrl}
                </a>
              </div>
              <a
                href={event.invitationCardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                عرض البطاقة
              </a>
            </div>
          </div>
        </div>
      )}

      {/* QR Code URL */}
      {event.qrCodeUrl && (
        <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 rounded-2xl border border-cyan-700/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">QR Code</h3>
          </div>
          <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 max-w-xs">
                <p className="text-cyan-100 text-sm mb-2">رابط QR Code:</p>
                <a
                  href={event.qrCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 text-sm block truncate text-left"
                  title={event.qrCodeUrl}
                  dir="ltr"
                >
                  {event.qrCodeUrl}
                </a>
              </div>
              <a
                href={event.qrCodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                عرض QR Code
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
