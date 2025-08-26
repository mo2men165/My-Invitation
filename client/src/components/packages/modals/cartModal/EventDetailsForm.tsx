'use client';
import React, { memo, useCallback } from 'react';
import { AlertCircle, Calendar, Clock, User, MessageSquare, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { CartForm } from '@/types';
import { formatCurrency } from '@/utils/calculations';

interface FormErrors {
  [key: string]: string;
}

interface EventDetailsFormProps {
  cartForm: CartForm;
  onInputChange: (field: string, value: any) => void;
  errors: FormErrors;
  currentPackage: any;
  isEditMode?: boolean;
  isUpdating?: boolean;
}

const EventDetailsForm = memo<EventDetailsFormProps>(({
  cartForm,
  onInputChange,
  errors,
  currentPackage,
  isEditMode = false,
  isUpdating = false
}) => {
  const handleInviteCountChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onInputChange('inviteCount', parseInt(e.target.value));
  }, [onInputChange]);

  const handleHostNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange('hostName', e.target.value);
  }, [onInputChange]);

  const handleEventDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange('eventDate', e.target.value);
  }, [onInputChange]);

  const handleStartTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange('startTime', e.target.value);
  }, [onInputChange]);

  const handleEndTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange('endTime', e.target.value);
  }, [onInputChange]);

  const handleInvitationTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange('invitationText', e.target.value);
  }, [onInputChange]);

  const handleQRCodeToggle = useCallback(() => {
    onInputChange('qrCode', !cartForm.qrCode);
  }, [onInputChange, cartForm.qrCode]);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-[#C09B52]" />
        تفاصيل المناسبة
        {isEditMode && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-[#C09B52] bg-[#C09B52]/10 px-2 py-1 rounded-full">
              تحديث مباشر
            </span>
            {isUpdating && (
              <div className="w-4 h-4 border-2 border-[#C09B52] border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        )}
      </h3>
      
      {/* Invitation Count - Premium Selector */}
      <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-[#C09B52]" />
          عدد الدعوات <span className="text-red-400 text-lg">*</span>
          {isEditMode && (
            <span className="text-xs text-gray-400 ml-2">يحدث تلقائياً</span>
          )}
        </label>
        <div className="relative">
          <select
            value={cartForm.inviteCount}
            onChange={handleInviteCountChange}
            disabled={isUpdating}
            className={`w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 focus:border-[#C09B52] transition-all duration-300 appearance-none cursor-pointer text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {currentPackage.pricing.map((option: any) => (
              <option key={option.invites} value={option.invites} className="bg-gray-800 py-2">
                {option.invites} دعوة - {formatCurrency(option.price)}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <div className={`w-2 h-2 bg-[#C09B52] rounded-full ${isUpdating ? 'animate-pulse' : ''}`}></div>
          </div>
        </div>
      </div>

      {/* Host Name */}
      <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-[#C09B52]" />
          اسم المضيف <span className="text-red-400 text-lg">*</span>
          {isEditMode && (
            <span className="text-xs text-gray-400 ml-2">يحدث تلقائياً</span>
          )}
        </label>
        <Input
          type="text"
          value={cartForm.hostName}
          onChange={handleHostNameChange}
          disabled={isUpdating}
          className={`w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            errors.hostName ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
          }`}
          placeholder="أدخل اسم المضيف"
        />
        {errors.hostName && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-sm animate-pulse">
            <AlertCircle className="w-4 h-4" />
            {errors.hostName}
          </div>
        )}
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Event Date */}
        <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C09B52]" />
            التاريخ <span className="text-red-400 text-lg">*</span>
          </label>
          <Input
            type="date"
            value={cartForm.eventDate}
            onChange={handleEventDateChange}
            min={new Date().toISOString().split('T')[0]}
            disabled={isUpdating}
            className={`w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.eventDate ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
            }`}
          />
          {errors.eventDate && (
            <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              {errors.eventDate}
            </div>
          )}
        </div>

        {/* Start Time */}
        <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C09B52]" />
            البداية <span className="text-red-400 text-lg">*</span>
          </label>
          <Input
            type="time"
            value={cartForm.startTime}
            onChange={handleStartTimeChange}
            disabled={isUpdating}
            className={`w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.startTime ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
            }`}
          />
          {errors.startTime && (
            <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              {errors.startTime}
            </div>
          )}
        </div>

        {/* End Time */}
        <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C09B52]" />
            النهاية <span className="text-red-400 text-lg">*</span>
          </label>
          <Input
            type="time"
            value={cartForm.endTime}
            onChange={handleEndTimeChange}
            disabled={isUpdating}
            className={`w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.endTime ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
            }`}
          />
          {errors.endTime && (
            <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              {errors.endTime}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Toggle - Modern Style */}
      <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-4 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-[#C09B52]" />
          إضافة كود QR للدعوة
        </label>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm">يساعد في تسهيل عملية الدخول للضيوف</p>
            <p className="text-gray-400 text-xs mt-1">يمكن مسح الكود للتأكد من صحة الدعوة</p>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleQRCodeToggle}
              disabled={isUpdating}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                cartForm.qrCode ? 'bg-[#C09B52]' : 'bg-gray-600'
              }`}
              aria-label={cartForm.qrCode ? 'إلغاء كود QR' : 'إضافة كود QR'}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-300 flex items-center justify-center ${
                cartForm.qrCode ? 'translate-x-8' : 'translate-x-0'
              }`}>
                {cartForm.qrCode && <QrCode className="w-3 h-3 text-[#C09B52]" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Invitation Text */}
      <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#C09B52]" />
          نص الدعوة <span className="text-red-400 text-lg">*</span>
          {isEditMode && (
            <span className="text-xs text-gray-400 ml-2">يحدث تلقائياً</span>
          )}
        </label>
        <div className="relative">
          <textarea
            value={cartForm.invitationText}
            onChange={handleInvitationTextChange}
            rows={4}
            maxLength={1000}
            disabled={isUpdating}
            className={`w-full px-4 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 resize-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.invitationText ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
            }`}
            placeholder="اكتب نص الدعوة هنا... مثال: يسعدنا دعوتكم لحضور..."
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-lg">
            {cartForm.invitationText.length}/1000
          </div>
        </div>
        {errors.invitationText && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {errors.invitationText}
          </div>
        )}
      </div>
    </div>
  );
});

EventDetailsForm.displayName = 'EventDetailsForm';
export default EventDetailsForm;