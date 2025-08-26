import React from 'react';

const PageHeader: React.FC = () => {
  return (
    <div className="text-center mb-16">
      <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
        اختر <span className="text-[#C09B52]">باقتك</span> المثالية
      </h1>
      <p className="text-xl text-gray-400 max-w-3xl mx-auto">
        باقات مصممة خصيصاً لتناسب احتياجاتك مع أحدث التقنيات وأفضل الخدمات
      </p>
    </div>
  );
};

export default PageHeader;
