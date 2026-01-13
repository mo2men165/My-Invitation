'use client';
import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useToast } from '@/hooks/useToast';
import { logout } from '@/store/authSlice';
import { useRouter } from 'next/navigation';

interface UpdateProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useAccountSettings = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    setIsUpdatingProfile(true);
    
    try {
      // Call your API to update profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في تحديث الملف الشخصي');
      }

      // Update Redux state with new user data
      // dispatch(updateUserProfile(result.user)); // You'll need to add this action

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات الملف الشخصي",
        variant: "default",
        duration: 3000
      });

      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
        duration: 3000
      });
      return false;
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [dispatch, toast]);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة المرور الجديدة وتأكيدها غير متطابقين",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في تغيير كلمة المرور');
      }

      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
        variant: "default",
        duration: 3000
      });

      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في تغيير كلمة المرور",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
        duration: 3000
      });
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  }, [toast]);

  const deleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في حذف الحساب');
      }

      // Clear auth state and redirect to home
      dispatch(logout());
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      toast({
        title: "تم حذف الحساب",
        description: "تم حذف حسابك بنجاح",
        variant: "default",
        duration: 3000
      });

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1000);

      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الحساب",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
        duration: 3000
      });
      return false;
    } finally {
      setIsDeletingAccount(false);
    }
  }, [dispatch, toast, router]);

  return {
    user,
    isLoading,
    isUpdatingProfile,
    isChangingPassword,
    isDeletingAccount,
    updateProfile,
    changePassword,
    deleteAccount
  };
};