'use client';
import React from 'react';
import { Check, X } from 'lucide-react';
import { PackageData } from '@/types';
import { packageData } from '@/constants';

interface CompareTableProps {
  packageTypes: (keyof PackageData)[]; // Array of package types being compared
}

// Map package features to comparison format based on actual packageData
const getPackageFeatures = (packageType: keyof PackageData) => {
  const features: Record<string, string> = {};
  const packageFeatures = packageData[packageType].features;
  
  // Map features to comparison categories
  features['بطاقة الدعوة'] = packageFeatures.some(f => f.includes('بطاقة دعوة')) ? 'متاح' : 'غير متاح';
  features['بطاقة الدخول'] = packageFeatures.some(f => f.includes('بطاقة دخول')) ? 'متاح' : 'غير متاح';
  features['رمز الكيو آر كود'] = packageFeatures.some(f => f.includes('الكيو آر كود')) ? 'متاح' : 'غير متاح';
  features['رقم تسلسلي'] = 'متاح'; // Available for all packages
  features['إضافة مرافقين'] = packageFeatures.some(f => f.includes('مرافقين')) ? 'متاح' : 'غير متاح';
  features['تصميم حسب الطلب'] = packageFeatures.some(f => f.includes('حسب الطلب')) ? 'متاح' : 'غير متاح';
  features['إحصائية الحضور'] = packageFeatures.some(f => f.includes('إحصائية')) ? 'متاح' : 'غير متاح';
  features['تذكير قبل المناسبة'] = packageFeatures.some(f => f.includes('تذكير')) ? 'متاح' : 'غير متاح';
  features['رسالة شكر'] = packageFeatures.some(f => f.includes('رسالة شكر')) ? 'متاح' : 'غير متاح';
  features['قروب واتساب مخصص'] = packageFeatures.some(f => f.includes('قروب واتساب')) ? 'متاح' : 'غير متاح';
  features['دعم متعدد اللغات'] = packageFeatures.some(f => f.includes('لغتين') || f.includes('العربية / الإنجليزية')) ? 'متاح' : 'غير متاح';
  features['فيديو دعوة 3D'] = packageFeatures.some(f => f.includes('فيديو دعوة')) ? 'متاح' : 'غير متاح';
  features['رسالة تهنئة'] = packageFeatures.some(f => f.includes('رسالة تهنئة')) ? 'متاح' : 'غير متاح';
  features['مشرف لقراءة الكود'] = packageFeatures.some(f => f.includes('مشرف لقراءة')) ? 'متاح' : 'غير متاح';
  features['توزيع من العميل'] = packageFeatures.some(f => f.includes('توزيعها من قبل العميل')) ? 'متاح' : 'غير متاح';
  features['توزيع من الفريق'] = packageFeatures.some(f => f.includes('من قبل فريقنا')) ? 'متاح' : 'غير متاح';
  features['زيادة البطاقات'] = (packageType === 'premium' || packageType === 'vip') ? 'متاح' : 'غير متاح';
  
  return features;
};

const CompareTable: React.FC<CompareTableProps> = ({ packageTypes }) => {
  if (packageTypes.length === 0) return null;

  // Get all unique features
  const allFeatures = Array.from(
    new Set(packageTypes.flatMap(type => Object.keys(getPackageFeatures(type))))
  );

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white">مقارنة مميزات الباقات</h2>
        <p className="text-gray-400 text-sm mt-2">
          مقارنة شاملة بين مستويات الباقات المختلفة
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right p-4 text-white font-medium w-1/4">الميزة</th>
              {packageTypes.map((packageType) => {
                const pkg = packageData[packageType];
                return (
                  <th key={packageType} className="text-center p-4 text-white font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <pkg.icon className="w-6 h-6 text-[#C09B52]" />
                      <span>باقة {pkg.name}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((feature) => (
              <tr key={feature} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-300">
                <td className="p-4 text-gray-300 font-medium">{feature}</td>
                {packageTypes.map((packageType) => {
                  const packageFeatures = getPackageFeatures(packageType);
                  const featureValue = packageFeatures[feature];
                  
                  return (
                    <td key={packageType} className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        {featureValue === 'متاح' ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-5 h-5" />
                            <span className="text-sm">متاح</span>
                          </div>
                        ) : featureValue === 'غير متاح' ? (
                          <div className="flex items-center gap-2 text-red-400">
                            <X className="w-5 h-5" />
                            <span className="text-sm">غير متاح</span>
                          </div>
                        ) : featureValue ? (
                          <span className="text-gray-300 text-sm max-w-32 leading-tight">{featureValue}</span>
                        ) : (
                          <span className="text-red-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompareTable;