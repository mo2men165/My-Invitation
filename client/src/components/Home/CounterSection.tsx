// components/Home/CounterSection.tsx
'use client';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Users, Calendar, Star, ThumbsUp, BarChart3 } from 'lucide-react';

interface CounterItemProps {
  icon: React.ComponentType<any>;
  number: number;
  label: string;
  delay: number;
}

function CounterItem({ icon: Icon, number, label, delay }: CounterItemProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.5 });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        let start = 0;
        const end = number;
        const duration = 2000;
        const increment = end / (duration / 16);

        const counter = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(counter);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);

        return () => clearInterval(counter);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isInView, number, delay]);

  return (
    <motion.div
      ref={ref}
      className="text-center group"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
    >
      <div className="relative">
        {/* Background Circle */}
        <motion.div 
          className="w-24 h-24 mx-auto mb-6 rounded-full border-4 flex items-center justify-center relative overflow-hidden"
          style={{ borderColor: '#C09B52' }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated Background */}
          <motion.div 
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: '#C09B52' }}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.8, delay: delay / 1000 + 0.2 }}
          />
          
          {/* Icon */}
          <Icon className="w-10 h-10 text-white relative z-10" />
          
          {/* Glow Effect */}
          <motion.div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{ backgroundColor: '#C09B52' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Number */}
        <motion.div 
          className="text-5xl lg:text-6xl font-bold mb-2"
          style={{ color: '#C09B52' }}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.5, delay: delay / 1000 + 0.3 }}
        >
          {count.toLocaleString('ar-SA')}
          {number >= 1000 && count === number && '+'}
        </motion.div>

        {/* Label */}
        <motion.p 
          className="text-lg font-medium text-gray-600"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: delay / 1000 + 0.5 }}
        >
          {label}
        </motion.p>
      </div>
    </motion.div>
  );
}

export function CounterSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });

  const counters = [
    {
      icon: BarChart3,
      number: 7000,
      label: "استخدام الباركود الذكي",
      delay: 0
    },
    {
      icon: Users,
      number: 150000,
      label: "عميل مسجل",
      delay: 200
    },
    {
      icon: Star,
      number: 150000,
      label: "مناسبة",
      delay: 400
    },
    {
      icon: ThumbsUp,
      number: 550000,
      label: "دعوة منفذة",
      delay: 600
    }
  ];

  return (
    <section ref={ref} className="py-20 bg-black relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ backgroundColor: '#C09B52' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-5"
          style={{ backgroundColor: '#C09B52' }}
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: '#C09B52',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            أرقامنا تتحدث عن نفسها
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            نفخر بثقة عملائنا وإنجازاتنا في عالم الدعوات الرقمية
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {counters.map((counter, index) => (
            <CounterItem
              key={index}
              icon={counter.icon}
              number={counter.number}
              label={counter.label}
              delay={counter.delay}
            />
          ))}
        </div>

        {/* Bottom Decoration */}
        <motion.div 
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div 
            className="w-20 h-1 rounded-full"
            style={{ backgroundColor: '#C09B52' }}
          />
        </motion.div>
      </div>
    </section>
  );
}