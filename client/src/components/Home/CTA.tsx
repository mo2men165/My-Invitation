// components/Home/CTA.tsx
'use client';
import Link from 'next/link';
import { motion, useInView, easeOut } from 'framer-motion';
import { useRef, useState } from 'react';
import { ctaFeatures } from '@/constants';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Sparkles, Check, Star, Zap, Gift } from 'lucide-react';

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);


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
        ease: easeOut
      }
    }
  };

  return (
    <section ref={ref} className="relative py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: '#C09B52' }}
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-2xl"
          style={{ backgroundColor: '#C09B52' }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        {/* Floating Particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ 
              backgroundColor: '#C09B52',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          />
        ))}

        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-5">
          <motion.div 
            className="absolute top-10 right-10 w-32 h-32 border-2 rotate-45"
            style={{ borderColor: '#C09B52' }}
            animate={{ rotate: [45, 225, 45] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-10 left-10 w-24 h-24 border border-dashed rounded-full"
            style={{ borderColor: '#C09B52' }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>
      </div>

      <div className="container mx-auto px-8 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center bg-white/10 border border-white/20 rounded-full px-6 py-2 backdrop-blur-sm mb-8"
            variants={itemVariants}
          >
            <Sparkles className="w-4 h-4 ml-2" style={{ color: '#C09B52' }} />
            <span className="text-white/90 font-medium">ابدأ رحلتك معنا اليوم</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h2 
            className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            variants={itemVariants}
          >
            جاهز لبدء مناسبتك
            <br />
            <span style={{ color: '#C09B52' }}>التالية؟</span>
          </motion.h2>

          {/* Description */}
          <motion.p 
            className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            انضم إلى آلاف العملاء الذين يثقون بنا في إدارة مناسباتهم.
            <br />
            <strong className="text-white">إنشاء دعواتك أصبح أسهل من أي وقت مضى!</strong>
          </motion.p>

          {/* Features Grid */}
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-12"
            variants={itemVariants}
          >
            {ctaFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <motion.div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full border-2 flex items-center justify-center relative"
                  style={{ borderColor: '#C09B52' }}
                  animate={hoveredFeature === index ? { 
                    backgroundColor: '#C09B52',
                    scale: 1.1 
                  } : {
                    backgroundColor: 'transparent',
                    scale: 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon 
                    className={`w-8 h-8 transition-colors duration-300 ${
                      hoveredFeature === index ? 'text-black' : 'text-white'
                    }`}
                  />
                  
                  {/* Glow effect */}
                  {hoveredFeature === index && (
                    <motion.div 
                      className="absolute inset-0 rounded-full opacity-30 blur-lg"
                      style={{ backgroundColor: '#C09B52' }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8"
            variants={itemVariants}
          >
            <Button 
              size="lg" 
              asChild 
              className="group text-black font-bold px-10 py-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
              style={{ 
                backgroundColor: '#C09B52',
                boxShadow: '0 20px 60px rgba(192, 155, 82, 0.4)'
              }}
            >
              <Link href="/packages" className="flex items-center relative z-10">
                ابدأ الآن مجاناً
                <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                
                {/* Shimmer Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: [-100, 200] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="border-2 text-white px-10 py-4 rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105 group"
              style={{ borderColor: '#C09B52' }}
            >
              <Link href="/contact" className="flex items-center">
                تحدث مع فريقنا
                <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8 text-gray-400"
            variants={itemVariants}
          >
            {[
              "✓ بدون رسوم خفية",
              "✓ إلغاء في أي وقت", 
              "✓ دعم عملاء 24/7"
            ].map((item, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-2 "
                whileHover={{ scale: 1.05, color: '#C09B52' }}
              >
                <Check className="w-4 h-4" style={{ color: '#C09B52' }} />
                <span className="text-sm font-medium">{item}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom Decoration */}
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <motion.div 
              className="w-24 h-1 mx-auto rounded-full"
              style={{ backgroundColor: '#C09B52' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}