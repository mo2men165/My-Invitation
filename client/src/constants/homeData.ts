// client/src/constants/homeData.ts - Home page related constants
import { BarChart3, Users, Calendar, Zap, Gift, Shield, Star } from 'lucide-react';

// About section features
export const aboutFeatures = [
  "تنظيم ضيوفك دون تكرار أو تزوير",
  "تصاميم قابلة للتخصيص تناسب هوية مناسبتك",
  "إدارة كاملة عبر جوالك - من الإرسال إلى تتبع الحضور"
];

// Counter section data
export const counters = [
  {
    icon: BarChart3,
    number: 7000,
    label: "استخدام الباركود الذكي",
    delay: 0
  },
  {
    icon: Users,
    number: 10000,
    label: "عميل مسجل",
    delay: 0.2
  },
  {
    icon: Calendar,
    number: 5000,
    label: "مناسبة منظمة",
    delay: 0.4
  }
];

// CTA section features
export const ctaFeatures = [
  {
    icon: Zap,
    title: "إنشاء فوري",
    description: "دعوتك جاهزة في دقائق"
  },
  {
    icon: Gift,
    title: "تجربة مجانية",
    description: "ابدأ بدون أي تكلفة"
  },
  {
    icon: Shield,
    title: "أمان مضمون",
    description: "بياناتك محمية 100%"
  },
  {
    icon: Star,
    title: "دعم فني",
    description: "نحن هنا لمساعدتك"
  }
];

// Invitation slider data
export const invitationSliderData = [
  {
    id: 1,
    title: "دعوة زفاف أنيقة",
    category: "زفاف",
    image: "/Design - Front.webp",
    likes: 1250,
    views: 5400
  },
  {
    id: 2,
    title: "دعوة تخرج مميزة",
    category: "تخرج",
    image: "/graduation invites/Gold Black Elegant Graduation Party Invitation.webp",
    likes: 890,
    views: 3200
  },
  {
    id: 3,
    title: "دعوة عيد ميلاد",
    category: "عيد ميلاد",
    image: "/birthday invites/Design - Front.webp",
    likes: 2100,
    views: 7800
  }
];
