// components/Home/AboutSection.tsx
'use client';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle, Star, Users, Calendar } from 'lucide-react';

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const features = [
    "تنظيم ضيوفك دون تكرار أو تزوير",
    "تصاميم قابلة للتخصيص تناسب هوية مناسبتك",
    "إدارة كاملة عبر جوالك - من الإرسال إلى تتبع الحضور"
  ];

  return (
    <section ref={ref} className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-8">
        <motion.div 
          className="grid lg:grid-cols-2 gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          
          {/* Content Side */}
          <motion.div className="space-y-8" variants={itemVariants}>
            <div className="space-y-6">
              <motion.div 
                className="inline-flex items-center bg-gray-100 rounded-full px-4 py-2"
                variants={itemVariants}
              >
                <Star className="w-4 h-4 mr-2 ml-2" style={{ color: '#C09B52' }} />
                <span className="text-sm font-medium text-gray-700">
                  أول منصة سعودية متخصصة في دعوات المناسبات
                </span>
              </motion.div>

              <motion.h2 
                className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight"
                variants={itemVariants}
              >
                تعرف علي <span className="uppercase" style={{ color: '#C09B52' }}>Invitation</span>
              </motion.h2>

              <motion.p 
                className="text-xl text-gray-600 leading-relaxed"
                variants={itemVariants}
              >
                أول منصة سعودية متخصصة في دعوات المناسبات الإلكترونية باركود دخول فريدا
              </motion.p>

              <motion.div 
                className="bg-gray-50 p-6 rounded-2xl"
                variants={itemVariants}
              >
                <p className="text-lg text-gray-700 leading-relaxed">
                  نحن في <strong className="uppercase" style={{ color: '#C09B52' }}>Invitation</strong> نقدم حلاً ثورياً لإدارة دعواتك الرقمية 
                  - من الأفراح الى الفعاليات الخاصة. بطاقاتنا الذكية المزودة باركود شخصي تضمن:
                </p>
              </motion.div>
            </div>

            <motion.div className="space-y-4" variants={itemVariants}>
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start space-x-3 "
                  variants={itemVariants}
                >
                  <CheckCircle className="w-6 h-6 mt-0.5 flex-shrink-0" style={{ color: '#C09B52' }} />
                  <span className="text-gray-700 text-lg">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button 
                size="lg" 
                asChild 
                className="group text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{ 
                  backgroundColor: '#C09B52',
                  boxShadow: '0 10px 30px rgba(192, 155, 82, 0.3)'
                }}
              >
                <Link href="/about" className="flex items-center">
                  اقرأ المزيد
                  <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Visual Side */}
          <motion.div 
            className="relative"
            variants={imageVariants}
          >
            {/* Main Phone Mockup */}
            <div className="relative z-10">
              <motion.div 
                className="w-80 h-96 mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 shadow-2xl"
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl h-full p-4 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-500">myinvitation-sa.com</div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    <div 
                      className="h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#C09B52' }}
                    >
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Button */}
                  <div 
                    className="h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#C09B52' }}
                  >
                    <span className="text-white font-bold text-sm">إرسال الدعوة</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-8 -right-8 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#C09B52' }}
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>

            <motion.div 
              className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: '#D4AD63' }}
              animate={{ 
                y: [0, 8, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              <Star className="w-6 h-6 text-white" />
            </motion.div>

            {/* Background Decorative Elements */}
            <div className="absolute inset-0 -z-10">
              <motion.div 
                className="absolute top-1/4 -right-12 w-32 h-32 rounded-full opacity-10"
                style={{ backgroundColor: '#C09B52' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-1/4 -left-12 w-24 h-24 rounded-full opacity-10"
                style={{ backgroundColor: '#C09B52' }}
                animate={{ scale: [1.1, 1, 1.1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}