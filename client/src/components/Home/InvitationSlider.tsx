// components/sections/InvitationSlider.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Eye, Download } from 'lucide-react';
import { invitationSliderData } from '@/constants';
import Image from 'next/image';

export function InvitationSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const invitations = [
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
      title: "دعوة استقبال مولود جديد",
      category: "استقبال مولود", 
      image: "/ستوري اعلان قدوم مولود جديد بيج و بنفسجي برسومات كرتونيه.webp",
      likes: 980,
      views: 3200
    },
    {
      id: 3,
      title: "دعوة حفل تخرج ذهبية",
      category: "تخرج",
      image: "/IMG-20250609-WA0009.webp", 
      likes: 750,
      views: 2800
    },
    {
      id: 4,
      title: "دعوة تخرج كلاسيكية",
      category: "تخرج",
      image: "/WhatsApp Image 2025-07-01 at 19.06.42_1c7b3a03 (1) (1).webp",
      likes: 650,
      views: 2100
    },
    {
      id: 5,
      title: "دعوة حفل تخرج أنيقة",
      category: "تخرج",
      image: "/Gold Black Elegant Graduation Party Invitation.webp",
      likes: 920,
      views: 4100
    },
    {
      id: 6,
      title: "دعوة تخرج رمادية ذهبية",
      category: "تخرج",
      image: "/دعوة حفل تخرج رمادي وذهبي عصرية.webp",
      likes: 840,
      views: 3500
    }
  ];

  useEffect(() => {
    if (isAutoPlaying) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % invitations.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isAutoPlaying, invitations.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % invitations.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + invitations.length) % invitations.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  type Invitation = {
    id: number;
    title: string;
    category: string;
    image: string;
    likes: number;
    views: number;
    position?: number;
  };

  const getVisibleSlides = () => {
    const slides: Invitation[] = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentSlide + i) % invitationSliderData.length;
      slides.push({ ...invitationSliderData[index], position: i });
    }
    return slides;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="container mx-auto px-8">
        
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="inline-flex items-center bg-white rounded-full px-6 py-2 shadow-md mb-6"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-2 h-2 rounded-full ml-2" style={{ backgroundColor: '#C09B52' }} />
            <span className="text-gray-600 font-medium">تصاميم حصرية</span>
          </motion.div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            تصاميم <span style={{ color: '#C09B52' }}>INVITATION</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            اختر من مجموعة واسعة من التصاميم الاحترافية المصممة خصيصاً لمناسباتك المميزة
          </p>
        </motion.div>

        {/* Slider Container */}
        <div className="relative max-w-6xl mx-auto">
          
          {/* Main Slider */}
          <div className="relative h-96 lg:h-[500px] flex items-center justify-center">
            <AnimatePresence mode="sync">
              {getVisibleSlides().map((invitation, index) => (
                <motion.div
                  key={`${invitation.id}-${currentSlide}`}
                  className={`absolute ${
                    index === 1 ? 'z-20' : 'z-10'
                  }`}
                  initial={{ 
                    x: index === 0 ? -200 : index === 2 ? 200 : 0,
                    scale: index === 1 ? 1 : 0.8,
                    opacity: index === 1 ? 1 : 0.6
                  }}
                  animate={{ 
                    x: index === 0 ? -200 : index === 2 ? 200 : 0,
                    scale: index === 1 ? 1 : 0.8,
                    opacity: index === 1 ? 1 : 0.6
                  }}
                  exit={{ 
                    x: index === 0 ? -400 : 400,
                    opacity: 0 
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{
                    transform: `translateX(${
                      index === 0 ? '-50%' : index === 2 ? '50%' : '0%'
                    })`
                  }}
                >
                  <div className="relative group cursor-pointer">
                    {/* Image Card */}
                    <motion.div 
                      className="w-64 lg:w-80 h-80 lg:h-96 rounded-3xl shadow-2xl overflow-hidden relative bg-white"
                      whileHover={index === 1 ? { scale: 1.05, y: -10 } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Image */}
                      <div className="relative w-full h-full">
                        <Image
                          src={invitation.image}
                          alt={invitation.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 256px, 320px"
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <div className="space-y-2">
                            <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                              {invitation.category}
                            </div>
                            <h3 className="text-lg font-bold">{invitation.title}</h3>
                            
                            {/* Stats */}
                            <div className="flex justify-between items-center pt-2">
                              <div className="flex space-x-4 ">
                                <div className="flex items-center space-x-1 ">
                                  <Heart className="w-4 h-4" />
                                  <span className="text-sm">{invitation.likes}</span>
                                </div>
                                <div className="flex items-center space-x-1 ">
                                  <Eye className="w-4 h-4" />
                                  <span className="text-sm">{invitation.views}</span>
                                </div>
                              </div>
                              <motion.button
                                className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Download className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Overlay for non-center cards */}
                      {index !== 1 && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                      )}
                    </motion.div>

                    {/* Glow Effect for Center Card */}
                    {index === 1 && (
                      <motion.div 
                        className="absolute inset-0 -z-10 rounded-3xl opacity-30 blur-xl"
                        style={{ backgroundColor: '#C09B52' }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Navigation Arrows - SWITCHED */}
          <button
            onClick={nextSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" 
              style={{ color: '#C09B52' }} />
          </button>

          <button
            onClick={prevSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors"
              style={{ color: '#C09B52' }} />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-12 space-x-3 ">
          {invitations.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 shadow-lg' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              style={index === currentSlide ? { backgroundColor: '#C09B52' } : {}}
            />
          ))}
        </div>

        {/* Categories - FIXED HOVER TRANSITION */}
        <motion.div 
          className="mt-16 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {['زفاف', 'خطوبة', 'عيد ميلاد', 'تخرج', 'استقبال مولود'].map((category, index) => (
            <motion.button
              key={category}
              className="px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg  text-gray-700 font-medium"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: '#C09B52'
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}