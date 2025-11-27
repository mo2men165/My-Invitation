'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, User, Calendar, MapPin, Users, DollarSign, Eye } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { useToast } from '@/hooks/useToast';

interface PendingEvent {
  id: string;
  user: {
    name: string;
    email: string;
    phone: string;
    city: string;
  };
  eventDetails: {
    hostName: string;
    eventDate: string;
    eventLocation: string;
    inviteCount: number;
    packageType: string;
  };
  totalPrice: number;
  paymentCompletedAt: string;
  status: string;
}

export function AdminPendingEvents() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const [invitationCardImage, setInvitationCardImage] = useState<File | null>(null);

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      const data = await adminAPI.getPendingEvents(1, 10);
      setEvents(data.data);
    } catch (error) {
      console.error('Error fetching pending events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEvents.length === events.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(events.map(e => e.id));
    }
  };

  const handleApprove = async (eventId: string) => {
    if (!invitationCardImage) {
      alert('يرجى رفع صورة بطاقة الدعوة');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(invitationCardImage.type)) {
      alert('نوع الملف غير مدعوم. يرجى رفع صورة (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (10MB)
    if (invitationCardImage.size > 10 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
      return;
    }

    setProcessing(prev => [...prev, eventId]);
    try {
      await adminAPI.approveEvent(eventId, invitationCardImage, notes || undefined);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowApprovalModal(false);
      setNotes('');
      setInvitationCardImage(null);
    } catch (error) {
      console.error('Error approving event:', error);
    } finally {
      setProcessing(prev => prev.filter(id => id !== eventId));
    }
  };

  const handleReject = async (eventId: string) => {
    if (!notes.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }
    
    setProcessing(prev => [...prev, eventId]);
    try {
      await adminAPI.rejectEvent(eventId, notes);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowRejectionModal(false);
      setNotes('');
    } catch (error) {
      console.error('Error rejecting event:', error);
    } finally {
      setProcessing(prev => prev.filter(id => id !== eventId));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedEvents.length === 0) return;
    
    try {
      await adminAPI.bulkApproveEvents(selectedEvents, notes);
      setEvents(prev => prev.filter(e => !selectedEvents.includes(e.id)));
      setSelectedEvents([]);
      setNotes('');
    } catch (error) {
      console.error('Error bulk approving events:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-6 hover:border-[#C09B52] transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-yellow-400 mr-3" />
            <h2 className="text-xl font-bold text-white mr-3">الأحداث المعلقة</h2>
            {events.length > 0 && (
              <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded-full text-sm ml-3">
                {events.length}
              </span>
            )}
          </div>
          
          {selectedEvents.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-sm"
              >
                موافقة جماعية ({selectedEvents.length})
              </button>
            </div>
          )}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد أحداث في انتظار الموافقة</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={selectedEvents.length === events.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-[#C09B52] bg-gray-800 border-gray-600 rounded focus:ring-[#C09B52] focus:ring-2"
              />
              <label className="mr-2 text-sm text-gray-400">تحديد الكل</label>
            </div>

            {events.map((event) => (
              <div
                key={event.id}
                className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:border-[#C09B52] transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => handleSelectEvent(event.id)}
                      className="w-4 h-4 text-[#C09B52] bg-gray-700 border-gray-600 rounded focus:ring-[#C09B52] focus:ring-2 mt-1 ml-3"
                    />
                    
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-white font-semibold mb-2">{event.eventDetails.hostName}</h3>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center text-gray-400">
                              <User className="w-4 h-4 ml-2" />
                              {event.user.name}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <Calendar className="w-4 h-4 ml-2" />
                              {formatDate(event.eventDetails.eventDate)}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <MapPin className="w-4 h-4 ml-2" />
                              {event.eventDetails.eventLocation}
                            </div>
                            <div className="flex items-center text-gray-400">
                              <Users className="w-4 h-4 ml-2" />
                              {event.eventDetails.inviteCount} دعوة
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="space-y-1 text-sm">
                            <div className="text-gray-400">نوع الحزمة</div>
                            <div className="text-white font-medium">{event.eventDetails.packageType}</div>
                            
                            <div className="flex items-center text-gray-400 mt-2">
                              <DollarSign className="w-4 h-4 ml-1" />
                              <span className="text-[#C09B52] font-bold">
                                {event.totalPrice.toLocaleString('ar-SA')} ر.س
                              </span>
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-1">
                              تم الدفع: {formatDate(event.paymentCompletedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentEventId(event.id);
                        setShowApprovalModal(true);
                      }}
                      disabled={processing.includes(event.id)}
                      className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
                      title="موافقة"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setCurrentEventId(event.id);
                        setShowRejectionModal(true);
                      }}
                      disabled={processing.includes(event.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
                      title="رفض"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">موافقة على الحدث</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52]"
                  rows={3}
                  placeholder="أضف ملاحظات للحدث..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  صورة بطاقة الدعوة (مطلوب)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                      if (!allowedTypes.includes(file.type)) {
                        toast({
                          title: "خطأ",
                          description: "نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG فقط",
                          variant: "destructive"
                        });
                        e.target.value = ''; // Clear the input
                        setInvitationCardImage(null);
                        return;
                      }
                      
                      // Validate file size (10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "خطأ",
                          description: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت",
                          variant: "destructive"
                        });
                        e.target.value = ''; // Clear the input
                        setInvitationCardImage(null);
                        return;
                      }
                      
                      setInvitationCardImage(file);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#C09B52] file:text-white hover:file:bg-[#A0823D]"
                />
                <p className="text-xs text-gray-500 mt-1">يجب أن تكون الصورة بصيغة JPEG أو PNG فقط (حد أقصى 10 ميجابايت)</p>
                {invitationCardImage && (
                  <p className="text-xs text-green-400 mt-1">تم اختيار الملف: {invitationCardImage.name}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setNotes('');
                  setInvitationCardImage(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleApprove(currentEventId)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                موافقة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">رفض الحدث</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                سبب الرفض (مطلوب)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#C09B52]"
                rows={3}
                placeholder="اكتب سبب رفض الحدث..."
                required
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setNotes('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReject(currentEventId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                رفض
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}