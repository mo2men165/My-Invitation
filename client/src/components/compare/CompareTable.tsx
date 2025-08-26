'use client';
import React from 'react';
import { Check, X } from 'lucide-react';
import { PackageData } from '@/types';
import { packageData } from '@/constants';

interface CompareTableProps {
  packageTypes: (keyof PackageData)[]; // Array of package types being compared
}

// Real package features comparison based on your specifications
const getPackageFeatures = (packageType: keyof PackageData) => {
  const features: Record<string, string> = {};
  
  switch (packageType) {
    case 'classic':
      features['طريقة الإرسال'] = 'من التطبيق عبر واتساب العميل';
      features['دعوة تجريبية'] = 'متاح';
      features['تذكير قبل المناسبة'] = 'قبل يوم واحد';
      features['القبول والاعتذار'] = 'متاح';
      features['كود دخول خاص'] = 'متاح';
      features['إحصائيات مفصلة'] = 'بالاسم والرقم';
      features['مسح أكواد الدخول'] = 'من التطبيق';
      features['متابعة قائمة الانتظار'] = 'غير متاح';
      features['دعوات بديلة'] = 'غير متاح';
      features['الدعم الفني'] = 'عادي';
      features['داعي إضافي'] = 'غير متاح';
      features['دعم متعدد اللغات'] = 'العربية فقط';
      features['رسالة شكر'] = 'غير متاح';
      features['قروب واتساب مخصص'] = 'غير متاح';
      break;
      
    case 'premium':
      features['طريقة الإرسال'] = 'من التطبيق عبر واتساب العميل';
      features['دعوة تجريبية'] = 'متاح';
      features['تذكير قبل المناسبة'] = 'قبل يوم واحد عبر واتساب';
      features['القبول والاعتذار'] = 'متاح';
      features['كود دخول خاص'] = 'متاح';
      features['إحصائيات مفصلة'] = 'بالاسم والرقم';
      features['مسح أكواد الدخول'] = 'عبر الدعم الفني';
      features['متابعة قائمة الانتظار'] = 'عبر واتساب';
      features['دعوات بديلة'] = '20% في حالة الاعتذار';
      features['الدعم الفني'] = 'محسن';
      features['داعي إضافي'] = 'غير متاح';
      features['دعم متعدد اللغات'] = 'العربية فقط';
      features['رسالة شكر'] = 'غير متاح';
      features['قروب واتساب مخصص'] = 'غير متاح';
      break;
      
    case 'vip':
      features['طريقة الإرسال'] = 'الدعم الفني برقم مخصص';
      features['دعوة تجريبية'] = 'متاح';
      features['تذكير قبل المناسبة'] = 'قبل يوم واحد';
      features['القبول والاعتذار'] = 'متاح';
      features['كود دخول خاص'] = 'متاح';
      features['إحصائيات مفصلة'] = 'بالاسم والرقم';
      features['مسح أكواد الدخول'] = 'باركود أو جوال';
      features['متابعة قائمة الانتظار'] = 'عبر واتساب';
      features['دعوات بديلة'] = '50% في حالة الاعتذار';
      features['الدعم الفني'] = 'مميز مع قروب مخصص';
      features['داعي إضافي'] = 'متاح';
      features['دعم متعدد اللغات'] = 'العربية والإنجليزية';
      features['رسالة شكر'] = 'بعد المناسبة بيوم';
      features['قروب واتساب مخصص'] = 'متاح';
      break;
      
    default:
      break;
  }
  
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