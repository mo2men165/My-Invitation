'use client';
import React from 'react';
import { User, Settings } from 'lucide-react';

interface AccountHeaderProps {
  userName: string;
  userEmail: string;
}

const AccountHeader: React.FC<AccountHeaderProps> = ({ userName, userEmail }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#C09B52] to-amber-600 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">
            إعدادات <span className="text-[#C09B52]">الحساب</span>
          </h1>
          <p className="text-gray-400 text-lg mt-1">
            إدارة معلومات حسابك الشخصي
          </p>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-4">
          <Settings className="w-6 h-6 text-[#C09B52]" />
          <div>
            <h2 className="text-xl font-semibold text-white">{userName}</h2>
            <p className="text-gray-400">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountHeader;
