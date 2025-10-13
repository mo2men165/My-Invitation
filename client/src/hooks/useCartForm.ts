// client/src/hooks/useCartForm.ts - Updated with setters for editing
import { useState, useCallback } from 'react';
import { CartForm, LocationData } from '@/types';
import { detectCityFromCoords } from '@/utils/detectCity';

export const useCartForm = () => {
  const [cartForm, setCartForm] = useState<CartForm>({
    inviteCount: 100,
    eventDate: '',
    startTime: '',
    endTime: '',
    invitationText: '',
    hostName: '',
    eventLocation: '',
    additionalCards: 0,
    gateSupervisors: 0,
    fastDelivery: false
  });

  const [locationData, setLocationData] = useState<LocationData>({
    address: '',
    coordinates: { lat: 24.7136, lng: 46.6753 },
    city: ''
  });

  const handleInputChange = useCallback((field: string, value: any) => {
    setCartForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLocationSelect = useCallback(
    (lat: number, lng: number, address: string) => {
      const detectedCity = detectCityFromCoords(lat, lng);
  
      setLocationData({
        address,
        coordinates: { lat, lng },
        city: detectedCity,
      });
  
      handleInputChange("eventLocation", address);
    },
    [handleInputChange]
  );
  

  const resetForm = useCallback(() => {
    setCartForm({
      inviteCount: 100,
      eventDate: '',
      startTime: '',
      endTime: '',
      invitationText: '',
      hostName: '',
      eventLocation: '',
      additionalCards: 0,
      gateSupervisors: 0,
      fastDelivery: false
    });
    setLocationData({
      address: '',
      coordinates: { lat: 24.7136, lng: 46.6753 },
      city: ''
    });
  }, []);

  return {
    cartForm,
    locationData,
    handleInputChange,
    handleLocationSelect,
    resetForm,
    // Add these for editing functionality
    setCartForm,
    setLocationData
  };
};