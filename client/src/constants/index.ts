import { AdditionalService, InvitationDesign, PackageData } from '@/types';
import { Crown, Gem, Shield } from 'lucide-react';


// Package Data
export const packageData: PackageData = {
    classic: {
      name: 'كلاسيكية',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500/30',
      features: [
        'إرسال الدعوات من التطبيق عن طريق الواتس اب',
        'إرسال دعوة تجريبية قبل إرسال الدعوات',
        'إرسال تذكير قبل المناسبة بـ يوم',
        'خاصية القبول أو الاعتذار للمدعوين',
        'كود دخول خاص لكل مدعو',
        'إحصائيات القبول والاعتذار',
        'إمكانية مسح أكواد الدخول من التطبيق'
      ],
      pricing: [
        { invites: 100, price: 1500 },
        { invites: 200, price: 3000 },
        { invites: 300, price: 4500 },
        { invites: 400, price: 6000 },
        { invites: 500, price: 7500 },
        { invites: 600, price: 9000 },
        { invites: 700, price: 10500 }
      ]
    },
    premium: {
      name: 'بريميوم',
      icon: Crown,
      color: 'from-[#C09B52] to-amber-600',
      borderColor: 'border-[#C09B52]/30',
      features: [
        'إرسال الدعوات من التطبيق عن طريق واتس اب العميل',
        'إرسال دعوة تجريبية قبل إرسال الدعوات',
        'إرسال تذكير قبل المناسبة بـ يوم على الواتس اب',
        'خاصية القبول أو الاعتذار للمدعوين',
        'كود دخول خاص لكل مدعو',
        'إحصائيات القبول والاعتذار',
        'إمكانية مسح أكواد الدعوات عن طريق الدعم الفني',
        'متابعة المدعوين على قائمة الانتظار',
        '20% دعوات بديلة في حالة الاعتذار'
      ],
      pricing: [
        { invites: 100, price: 2000 },
        { invites: 200, price: 4000 },
        { invites: 300, price: 6000 },
        { invites: 400, price: 8000 },
        { invites: 500, price: 10000 },
        { invites: 600, price: 12000 },
        { invites: 700, price: 14000 }
      ]
    },
    vip: {
      name: 'VIP',
      icon: Gem,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
      features: [
        'إرسال الدعوات عن طريق الدعم الفني من رقم خاص',
        'إرسال دعوة تجريبية قبل إرسال الدعوات',
        'إمكانية تعيين داعي إضافي للمناسبة',
        'وصول الدعوات على الواتساب',
        'إرسال تذكير قبل المناسبة بـ يوم',
        'خاصية القبول أو الاعتذار للمدعوين',
        'كود دخول خاص لكل مدعو',
        'إحصائيات القبول والاعتذار',
        'إمكانية مسح أكواد الدخول من جهاز الباركود',
        'متابعة المدعوين على قائمة الانتظار',
        'مراجعة ملف أسماء المدعوين قبل الإرسال',
        'قروب واتساب خاص للدعم الفني',
        'التواصل مع الداعي الإضافي',
        'الرد على استفسارات المدعوين',
        'توفير لغتين للدعوة العربية / الإنجليزية',
        'إضافة مستخدم جديد عن طريق الدعم الفني',
        'رسالة شكر للحضور بعد المناسبة',
        '50% دعوات بديلة في حالة اعتذار'
      ],
      pricing: [
        { invites: 100, price: 3000 },
        { invites: 200, price: 6000 },
        { invites: 300, price: 9000 },
        { invites: 400, price: 12000 },
        { invites: 500, price: 15000 },
        { invites: 600, price: 18000 },
        { invites: 700, price: 21000 }
      ]
    }
  };
  
  // Additional Services
  export const additionalServices: AdditionalService[] = [
    {
      id: 'extra-cards',
      name: 'كروت إضافية',
      description: 'كرت إضافي بمبلغ 30 ريال',
      price: 30,
      unit: 'كرت'
    },
    {
      id: 'gate-supervisors',
      name: 'خدمة مشرفين البوابة',
      description: 'مشرفين مع أجهزة قراءة الباركود',
      options: [
        { range: '100-300 مدعو', supervisors: 2, price: 3000 },
        { range: '300-500 مدعو', supervisors: 3, price: 4500 },
        { range: '500-700 مدعو', supervisors: 4, price: 6000 }
      ],
      cities: ['جدة', 'الرياض', 'الدمام', 'مكة المكرمة', 'الطائف']
    },
    {
      id: 'fast-delivery',
      name: 'تسريع التنفيذ',
      description: 'تنفيذ خلال يومين عمل بدلاً من 4-7 أيام',
      price: 3000
    }
  ];
  
  // Sample invitation designs based on your screenshots
  export const invitationDesigns: InvitationDesign[] = [
    // Birthday Invites
    { id: "66c7e1a1b8f3c4d5e6f7a8b1", name: 'دعوة عيد ميلاد فاطمة', category: 'birthday', image: '/birthday invites/Design - Front.webp' },
    { id: "66c7e1a2b8f3c4d5e6f7a8b2", name: 'دعوة بلون البني والأزرق البسيط', category: 'birthday', image: '/birthday invites/دعوة بلون البنى و الازرق بسيط عن حضور حفل مولود جديد.webp' },
    { id: "66c7e1a3b8f3c4d5e6f7a8b3", name: 'دعوة حفلة مولود جديد تصميم شخصيات', category: 'birthday', image: '/birthday invites/دعوة حفلة مولود جديد تصميم شخصيات قابلة للطباعة أزرق.webp' },
    { id: "66c7e1a4b8f3c4d5e6f7a8b4", name: 'دعوة عشاء لمولود أزرق وبيج', category: 'birthday', image: '/birthday invites/دعوة عشاء لمولودأزرق و بيج بسيط.webp' },
    { id: "66c7e1a5b8f3c4d5e6f7a8b5", name: 'ستوري إعلان قدوم مولود أزرق', category: 'birthday', image: '/birthday invites/ستوري اعلان قدوم مولود ازرق بسيط.webp' },
    { id: "66c7e1a6b8f3c4d5e6f7a8b6", name: 'ستوري إعلان مولود بيج وبنفسجي', category: 'birthday', image: '/birthday invites/ستوري اعلان قدوم مولود جديد بيج و بنفسجي برسومات كرتونيه.webp' },
    { id: "66c7e1a7b8f3c4d5e6f7a8b7", name: 'قصة Instagram وردي وأصفر', category: 'birthday', image: '/birthday invites/قصة Instagram اعلان قدوم مولود وردي واصفر.webp' },
    { id: "66c7e1a8b8f3c4d5e6f7a8b8", name: 'قصة Instagram بيج أنيق', category: 'birthday', image: '/birthday invites/قصة Instagram بيج انيق عن اعلان حفل زفاف .webp' },
    { id: "66c7e1a9b8f3c4d5e6f7a8b9", name: 'قصة انستجرام بيج أنيقة', category: 'birthday', image: '/birthday invites/قصة انستجرام بيج انيقة عن دعوة لحفل استقبال مولود.webp' },
    
    // Graduation Invites
    { id: "66c7e1aab8f3c4d5e6f7a8ba", name: 'دعوة تخرج ذهبي أسود أنيق', category: 'graduation', image: '/graduation invites/Gold Black Elegant Graduation Party Invitation.webp' },
    { id: "66c7e1abb8f3c4d5e6f7a8bb", name: 'بطاقة دعوة أزرق رسمي حفل تخرج', category: 'graduation', image: '/graduation invites/بطاقة دعوة أزرق رسمي حفل تخرج.webp' },
    { id: "66c7e1acb8f3c4d5e6f7a8bc", name: 'دعوة تخرج أبيض وذهبي بسيط', category: 'graduation', image: '/graduation invites/دعوة (مطبوعة) اللون الابيض و الدهبي  بسيط دعوة تخرج gold bordered elegant class of 2024 invitation .webp' },
    { id: "66c7e1adb8f3c4d5e6f7a8bd", name: 'دعوة وردي فاتح بنمط زهور', category: 'graduation', image: '/graduation invites/دعوة باللون الوردي الفاتح بنمط زهور عن حفل تخرج.webp' },
    { id: "66c7e1aeb8f3c4d5e6f7a8be", name: 'دعوة تخرج رمادي وذهبي عصرية', category: 'graduation', image: '/graduation invites/دعوة حفل تخرج رمادي وذهبي عصرية.webp' },
    { id: "66c7e1afb8f3c4d5e6f7a8bf", name: 'دعوة موف بسيط حفل تخرج', category: 'graduation', image: '/graduation invites/دعوة موف بسيط عن حفل تخرج .webp' },
    { id: "66c7e1b0b8f3c4d5e6f7a8c0", name: 'دعوة وردي وبنفسجي لطيف', category: 'graduation', image: '/graduation invites/دعوة وردي وبنفسجي لطيف حفل تخرج.webp' },
    { id: "66c7e1b1b8f3c4d5e6f7a8c1", name: 'قصتك أزرق بسيط عن التخرج', category: 'graduation', image: '/graduation invites/قصتك ازرق بسيط عن التخرج.webp' },
    { id: "66c7e1b2b8f3c4d5e6f7a8c2", name: 'نشرة إعلانية ستايل الجريدة', category: 'graduation', image: '/graduation invites/نشرة اعلانية ستايل الجريدة دعوة حفل تخرج.webp' },
    
    // Wedding Invites  
    { id: "66c7e1b3b8f3c4d5e6f7a8c3", name: 'دعوة زفاف كلاسيكية', category: 'wedding', image: '/wedding invites/IMG-20250609-WA0003.webp' },
    { id: "66c7e1b4b8f3c4d5e6f7a8c4", name: 'دعوة زفاف أنيقة', category: 'wedding', image: '/wedding invites/IMG-20250609-WA0005.webp' },
    { id: "66c7e1b5b8f3c4d5e6f7a8c5", name: 'دعوة زفاف ذهبية', category: 'wedding', image: '/wedding invites/IMG-20250609-WA0009.webp' },
    { id: "66c7e1b6b8f3c4d5e6f7a8c6", name: 'دعوة زفاف بسيطة', category: 'wedding', image: '/wedding invites/IMG-20250609-WA0012.webp' },
    { id: "66c7e1b7b8f3c4d5e6f7a8c7", name: 'دعوة زفاف تصميم خاص', category: 'wedding', image: '/wedding invites/Untitled design (2).webp' },
    { id: "66c7e1b8b8f3c4d5e6f7a8c8", name: 'دعوة زفاف واتساب', category: 'wedding', image: '/wedding invites/WhatsApp Image 2025-07-01 at 19.06.42_1c7b3a03 (1) (1).webp' },
    { id: "66c7e1b9b8f3c4d5e6f7a8c9", name: 'دعوة زفاف أخضر وأبيض وردي', category: 'wedding', image: '/wedding invites/دعوة (مطبوعة) اللون اخضر و ابيض وردي بسيط دعوة زواج arabic invitation leaves.webp' },
    { id: "66c7e1bab8f3c4d5e6f7a8ca", name: 'دعوة بيج وبني بسيطة', category: 'wedding', image: '/wedding invites/دعوة بيج و بني بسيطة لحفل زفاف.webp' },
    { id: "66c7e1bbb8f3c4d5e6f7a8cb", name: 'دعوة حضور حفل زفاف ناعمة', category: 'wedding', image: '/wedding invites/دعوة حضور حفل زفاف ناعمة لون بيج ووردي.webp' },
    { id: "66c7e1bcb8f3c4d5e6f7a8cc", name: 'دعوة حفل زفاف وردي', category: 'wedding', image: '/wedding invites/دعوة حفل زفاف wedding invitation pink .webp' },
    { id: "66c7e1bdb8f3c4d5e6f7a8cd", name: 'دعوة حفل زفاف أبيض وأخضر', category: 'wedding', image: '/wedding invites/دعوة حفل زفاف بلون أبيض و أخضر wedding invitation (2).webp' },
    { id: "66c7e1beb8f3c4d5e6f7a8ce", name: 'دعوة زفاف رمادي وأزرق مع الزهور', category: 'wedding', image: '/wedding invites/دعوة زفاف باللون الرمادي والازرق مع الزهور (1).webp' },
    { id: "66c7e1bfb8f3c4d5e6f7a8cf", name: 'دعوة زفاف بيج مع زهور', category: 'wedding', image: '/wedding invites/دعوة زفاف بلون بيج مع زهور مجاني wedding invitation - Copy.webp' },
    { id: "66c7e1c0b8f3c4d5e6f7a8d0", name: 'كارت دعوة زفاف وردي للطباعة', category: 'wedding', image: '/wedding invites/كارت دعوة زفاف بسيط للطباعة وردي.webp' }
  ];
  