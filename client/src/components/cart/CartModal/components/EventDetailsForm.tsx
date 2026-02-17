import React, { memo, useCallback, useMemo } from 'react';
import { Calendar, Clock, User, MessageSquare, Plus, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { CartFormData, FormErrors } from '../types';
import { formatCurrency } from '@/utils/calculations';
import { TIME_OPTIONS, CART_MODAL_CONSTANTS } from '@/constants/cartModalConstants';
import { useDebouncedInput } from '../hooks/useDebouncedInput';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enGB } from 'date-fns/locale';


interface EventDetailsFormProps {
  formData: CartFormData;
  onInputChange: (field: string, value: any) => void;
  errors: FormErrors;
  currentPackage: any;
  isEditMode?: boolean;
  isUpdating?: boolean;
}

const EventDetailsForm = memo<EventDetailsFormProps>(({
  formData,
  onInputChange,
  errors,
  currentPackage,
  isEditMode = false,
  isUpdating = false
}) => {
  // Use pre-generated time options from constants
  const timeOptions = TIME_OPTIONS;

  const minDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getTime() + (CART_MODAL_CONSTANTS.MIN_BOOKING_DAYS * 24 * 60 * 60 * 1000));
  }, []);
  


  // Debounced input handlers for better performance
  const { value: hostName, setValue: setHostName } = useDebouncedInput(
    formData.hostName,
    CART_MODAL_CONSTANTS.DEBOUNCE_DELAY,
    (value) => onInputChange('hostName', value)
  );

  const { value: invitationText, setValue: setInvitationText } = useDebouncedInput(
    formData.invitationText,
    CART_MODAL_CONSTANTS.DEBOUNCE_DELAY,
    (value) => onInputChange('invitationText', value)
  );

  // Calculate end time based on start time and package rules
  const calculateEndTime = useCallback((startTime: string, extraHours: number = 0) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const totalHours = CART_MODAL_CONSTANTS.BASE_EVENT_HOURS + extraHours;
    const endDate = new Date(startDate.getTime() + (totalHours * 60 * 60 * 1000));
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  const handleInviteCountChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onInputChange('inviteCount', parseInt(e.target.value));
  }, [onInputChange]);

  const handleStartTimeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStartTime = e.target.value;
    onInputChange('startTime', newStartTime);
    
    const newEndTime = calculateEndTime(newStartTime, formData.extraHours);
    onInputChange('endTime', newEndTime);
  }, [onInputChange, calculateEndTime, formData.extraHours]);

  const handleExtraHoursChange = useCallback((extraHours: number) => {
    onInputChange('extraHours', extraHours);
    
    if (formData.startTime) {
      const newEndTime = calculateEndTime(formData.startTime, extraHours);
      onInputChange('endTime', newEndTime);
    }
  }, [onInputChange, calculateEndTime, formData.startTime]);

  // const getMinDate = useCallback(() => {
  //   const today = new Date();
  //   const minDate = new Date(today.getTime() + (CART_MODAL_CONSTANTS.MIN_BOOKING_DAYS * 24 * 60 * 60 * 1000));
  //   return minDate.toISOString().split('T')[0];
  // }, []);

  const allowsExtraHours = currentPackage?.name !== 'كلاسيكية';
  const extraHourCost = CART_MODAL_CONSTANTS.EXTRA_HOUR_COST;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#C09B52]" />
        <span>تفاصيل المناسبة</span>
        {isEditMode && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-[#C09B52] bg-[#C09B52]/10 px-2 py-0.5 sm:py-1 rounded-full">
              تحديث مباشر
            </span>
            {isUpdating && (
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-[#C09B52] border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        )}
      </h3>
      
      {/* Invitation Count */}
      <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
          <User className="w-4 h-4 text-[#C09B52]" />
          عدد الدعوات <span className="text-red-400 text-base sm:text-lg">*</span>
        </label>
        <div className="relative">
          <select
            value={formData.inviteCount}
            onChange={handleInviteCountChange}
            disabled={isUpdating}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 focus:border-[#C09B52] transition-all duration-300 appearance-none cursor-pointer text-sm sm:text-base md:text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentPackage.pricing.map((option: any) => (
              <option key={option.invites} value={option.invites} className="bg-gray-800 py-2">
                {option.invites} دعوة - {formatCurrency(option.price)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Host Name */}
      <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
          <User className="w-4 h-4 text-[#C09B52]" />
          اسم المضيف <span className="text-red-400 text-base sm:text-lg">*</span>
        </label>
        <Input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          disabled={isUpdating}
          className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 text-sm sm:text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            errors.hostName ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
          }`}
          placeholder="أدخل اسم المضيف"
        />
        {errors.hostName && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-xs sm:text-sm">
            {errors.hostName}
          </div>
        )}
      </div>

      {/* Event Name */}
      <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
          <MessageSquare className="w-4 h-4 text-[#C09B52]" />
          اسم المناسبة
          <span className="text-red-400 mr-1">*</span>
        </label>
        <Input
          type="text"
          value={formData.eventName || ''}
          onChange={(e) => onInputChange('eventName', e.target.value)}
          disabled={isUpdating}
          className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 ${
            errors?.eventName ? 'border-red-500' : 'border-white/20'
          } rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 focus:border-[#C09B52] transition-all duration-300 text-sm sm:text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="أدخل اسم المناسبة "
        />
        {errors?.eventName && (
          <div className="text-red-400 text-xs sm:text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            {errors.eventName}
          </div>
        )}
        {!errors?.eventName && (
          <div className="text-gray-400 text-xs sm:text-sm mt-2">
            مثال: حفل زفاف أحمد وفاطمة، تخرج دفعة 2024، عيد ميلاد سارة
          </div>
        )}
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Event Date */}
        <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="w-4 h-4 text-[#C09B52]" />
            التاريخ <span className="text-red-400 text-base sm:text-lg">*</span>
          </label>
          <div style={{ direction: 'ltr' }}>
            <div className="relative">
            <DatePicker
              selected={formData.eventDate ? new Date(formData.eventDate) : null}
              onChange={(date: Date | null) => {
                onInputChange('eventDate', date ? date.toISOString().split('T')[0] : '');
              }}
              minDate={minDate}
              disabled={isUpdating}
              dateFormat="dd-MM-yyyy"
              locale={enGB}
              className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-lg sm:rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.eventDate ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
              }`}
              placeholderText="اختر التاريخ"
            />
              <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#C09B52]" />
              </div>
            </div>
          </div>
          <div className="text-gray-400 text-[10px] sm:text-xs mt-2">
            يجب حجز المناسبة قبل {CART_MODAL_CONSTANTS.MIN_BOOKING_DAYS} أيام على الأقل
          </div>
        </div>

        {/* <div className={`bg-white/[0.02] rounded-2xl border border-white/10 p-5 transition-all duration-300 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C09B52]" />
            التاريخ <span className="text-red-400 text-lg">*</span>
          </label>
          <div className="relative">
            <Input
              type="date"
              value={formData.eventDate}
              onChange={handleEventDateChange}
              min={getMinDate()}
              disabled={isUpdating}
              lang="en-US"
              data-calendar="gregorian"
              className={`w-full pl-4 pr-12 py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
                errors.eventDate ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
              }`}
              style={{
                colorScheme: 'dark',
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                textAlign: 'left',
                direction: 'ltr',
                unicodeBidi: 'embed'
              }}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Calendar className="w-5 h-5 text-[#C09B52]" />
            </div>
          </div>
          <div className="text-gray-400 text-xs mt-2">
            يجب حجز المناسبة قبل {CART_MODAL_CONSTANTS.MIN_BOOKING_DAYS} أيام على الأقل
          </div>
        </div> */}

        {/* Start Time */}
        <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Clock className="w-4 h-4 text-[#C09B52]" />
            البداية <span className="text-red-400 text-base sm:text-lg">*</span>
          </label>
          <select
            value={formData.startTime}
            onChange={handleStartTimeChange}
            disabled={isUpdating}
            className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-lg sm:rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 transition-all duration-300 appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.startTime ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
            }`}
          >
            <option value="" className="bg-gray-800">اختر الوقت</option>
            {timeOptions.map(({ value, label }) => (
              <option key={value} value={value} className="bg-gray-800 py-1">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* End Time - Auto-calculated */}
        <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 sm:col-span-2 md:col-span-1 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-2 sm:mb-3 flex flex-wrap items-center gap-1 sm:gap-2 text-sm sm:text-base">
            <Clock className="w-4 h-4 text-[#C09B52]" />
            النهاية <span className="text-red-400 text-base sm:text-lg">*</span>
            {!allowsExtraHours && (
              <span className="text-[10px] sm:text-xs text-gray-400">(4 ساعات)</span>
            )}
          </label>
          <div className="relative">
            <Input
              type="text"
              value={formData.endTime ? new Date(`1970-01-01T${formData.endTime}`).toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : ''}
              disabled={true}
              className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 border-white/20 rounded-lg sm:rounded-xl text-white text-sm sm:text-base opacity-75 cursor-not-allowed"
              placeholder="يحسب تلقائياً"
            />
          </div>
        </div>
      </div>

      {/* Extra Hours Option - Only for Premium/VIP */}
      {allowsExtraHours && (
        <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 ${
          isUpdating ? 'opacity-75' : ''
        }`}>
          <label className="text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Plus className="w-4 h-4 text-[#C09B52]" />
            ساعات إضافية (اختياري)
          </label>
          <div className="space-y-2 sm:space-y-3">
            <p className="text-gray-300 text-xs sm:text-sm">
              المدة الأساسية: {CART_MODAL_CONSTANTS.BASE_EVENT_HOURS} ساعات • تكلفة الساعة الإضافية: {formatCurrency(extraHourCost)}
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: CART_MODAL_CONSTANTS.MAX_EXTRA_HOURS + 1 }, (_, i) => i).map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => handleExtraHoursChange(hours)}
                  disabled={isUpdating}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-[70px] sm:min-w-[80px] sm:flex-none ${
                    (formData.extraHours || 0) === hours
                      ? 'bg-[#C09B52] text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {hours === 0 ? `${CART_MODAL_CONSTANTS.BASE_EVENT_HOURS} ساعات` : `${CART_MODAL_CONSTANTS.BASE_EVENT_HOURS + hours} ساعات`}
                  {hours > 0 && (
                    <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                      +{formatCurrency(hours * extraHourCost)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invitation Text */}
      <div className={`bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 md:p-5 transition-all duration-300 ${
        isUpdating ? 'opacity-75' : ''
      }`}>
        <label className="text-white font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
          <MessageSquare className="w-4 h-4 text-[#C09B52]" />
          نص الدعوة <span className="text-red-400 text-base sm:text-lg">*</span>
        </label>
        <div className="relative">
          <textarea
            value={invitationText}
            onChange={(e) => setInvitationText(e.target.value)}
            rows={4}
            maxLength={CART_MODAL_CONSTANTS.INVITATION_TEXT_MAX_LENGTH}
            disabled={isUpdating}
            className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-r from-white/5 to-white/10 border-2 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C09B52]/50 resize-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.invitationText ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-[#C09B52]'
            }`}
            placeholder="اكتب نص الدعوة هنا... مثال: يسعدنا دعوتكم لحضور..."
          />
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-[10px] sm:text-xs text-gray-400 bg-black/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
            {invitationText.length}/{CART_MODAL_CONSTANTS.INVITATION_TEXT_MAX_LENGTH}
          </div>
        </div>
        {errors.invitationText && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-xs sm:text-sm">
            {errors.invitationText}
          </div>
        )}
      </div>
    </div>
  );
});

EventDetailsForm.displayName = 'EventDetailsForm';
export default EventDetailsForm;
