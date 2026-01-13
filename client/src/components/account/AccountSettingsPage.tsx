'use client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { useWishlistData } from '@/hooks/useWishlistData';
import { useCompareData } from '@/hooks/useCompareData';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Components
import AccountHeader from './AccountHeader';
import ProfileForm from './ProfileForm';
import PasswordForm from './PasswordForm';
import AccountStats from './AccountStats';

const AccountSettingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { updateProfile, changePassword, isUpdatingProfile, isChangingPassword } = useAccountSettings();
  const { count: wishlistCount } = useWishlistData();
  const { count: compareCount } = useCompareData();

  // Show loading state for unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = {
    wishlistCount,
    compareCount,
    cartCount: 0, // You can get this from cart state
    ordersCount: 0, // You can get this from orders API
    joinDate: user.createdAt || new Date().toISOString(),
    lastLogin: user.lastLogin || new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-8 py-12">
        
        <AccountHeader 
          userName={user.name}
          userEmail={user.email}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileForm
              user={user}
              onSubmit={updateProfile}
              isLoading={isUpdatingProfile}
            />

            <PasswordForm
              onSubmit={changePassword}
              isLoading={isChangingPassword}
            />
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-1">
            <AccountStats stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;