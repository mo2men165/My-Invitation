import React, { memo, useMemo, useCallback } from 'react';
import { Edit3, Trash2, Calendar, MapPin, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/calculations';
import { invitationDesigns, packageData } from '@/constants';

interface CartItem {
  _id: string;
  designId: string;
  packageType: string;
  details: {
    inviteCount: number;
    eventDate: string;
    startTime: string;
    endTime: string;
    hostName: string;
    eventLocation: string;
    invitationText: string;
    additionalCards: number;
    gateSupervisors: number;
    extraHours: number;
    expeditedDelivery: boolean;
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity: string;
  };
  totalPrice: number;
}

interface VirtualizedCartListProps {
  items: CartItem[];
  onEditItem: (item: CartItem) => void;
  onDeleteItem: (itemId: string) => void;
  height?: number;
  itemHeight?: number;
}

// Individual cart item component
const CartItemComponent = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    items: CartItem[];
    onEditItem: (item: CartItem) => void;
    onDeleteItem: (itemId: string) => void;
  };
}>(({ index, style, data }) => {
  const { items, onEditItem, onDeleteItem } = data;
  const item = items[index];

  const design = invitationDesigns.find(d => d.id === item.designId);
  const packageInfo = packageData[item.packageType as keyof typeof packageData];

  const handleEdit = useCallback(() => {
    onEditItem(item);
  }, [item, onEditItem]);

  const handleDelete = useCallback(() => {
    onDeleteItem(item._id);
  }, [item._id, onDeleteItem]);

  // Format date in Arabic
  const formatArabicDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', options).format(date);
  }, []);

  // Format time in Arabic
  const formatArabicTime = useCallback((timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes.padStart(2, '0')} ${period}`;
  }, []);

  return (
    <div style={style} className="px-4 py-2">
      <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.05] rounded-2xl border border-white/10 p-6 hover:border-[#C09B52]/30 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#C09B52]/20 rounded-full blur-lg"></div>
              <packageInfo.icon className="relative w-12 h-12 text-[#C09B52]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{packageInfo.name}</h3>
              <p className="text-gray-400">{design?.name || 'تصميم غير معروف'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleEdit}
              className="h-10 w-10 border-[#C09B52]/30 text-[#C09B52] hover:bg-[#C09B52]/10"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              className="h-10 w-10 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Expedited Delivery Status */}
          {item.details.expeditedDelivery && (
            <div className="col-span-full flex items-center gap-2 text-[#C09B52] bg-[#C09B52]/10 rounded-lg p-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">توصيل سريع - 24-48 ساعة</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="w-4 h-4 text-[#C09B52]" />
            <span>{item.details.inviteCount} دعوة</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="w-4 h-4 text-[#C09B52]" />
            <span>{formatArabicDate(item.details.eventDate)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="w-4 h-4 text-[#C09B52]" />
            <span className="truncate">{item.details.eventLocation}</span>
          </div>
          
          <div className="text-gray-300">
            <span className="text-[#C09B52] font-semibold">
              {formatArabicTime(item.details.startTime)} - {formatArabicTime(item.details.endTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            المضيف: {item.details.hostName}
          </div>
          <div className="text-2xl font-bold text-[#C09B52]">
            {formatCurrency(item.totalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
});

CartItemComponent.displayName = 'CartItemComponent';

const VirtualizedCartList = memo<VirtualizedCartListProps>(({
  items,
  onEditItem,
  onDeleteItem,
  height = 600,
  itemHeight = 200
}) => {
  const itemData = useMemo(() => ({
    items,
    onEditItem,
    onDeleteItem
  }), [items, onEditItem, onDeleteItem]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/5 rounded-xl border border-white/10">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">السلة فارغة</h3>
          <p className="text-gray-400 text-sm">أضف بعض العناصر لإتمام عملية الدفع</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className="scrollbar-thin scrollbar-thumb-[#C09B52]/30 scrollbar-track-transparent"
        style={{ height: height, overflowY: 'auto' }}
      >
        {items.map((item, index) => (
          <CartItemComponent
            key={item._id}
            index={index}
            style={{ height: itemHeight }}
            data={itemData}
          />
        ))}
      </div>
    </div>
  );
});

VirtualizedCartList.displayName = 'VirtualizedCartList';
export default VirtualizedCartList;
