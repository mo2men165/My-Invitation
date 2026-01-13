// components/layout/Footer.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { easeOut, motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowUp,
} from 'lucide-react';
import { quickLinks, services } from '@/constants';

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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


  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer ref={ref} className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      
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
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ 
              backgroundColor: '#C09B52',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3]
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
        
        {/* Main Footer Content */}
        <motion.div 
          className="py-16"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-12">
            
            {/* Company Info */}
            <motion.div className="lg:col-span-1" variants={itemVariants}>
              <div className="space-y-6">
                {/* Logo */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image 
                    src="/logo.png" 
                    alt="Invitation Logo" 
                    width={160} 
                    height={60}
                    className="h-12 w-auto"
                  />
                </motion.div>

                <p className="text-gray-300 leading-relaxed">
                  منصة شاملة لإدارة وإرسال دعوات المناسبات في المملكة العربية السعودية. 
                  نقدم حلولاً رقمية مبتكرة لجعل مناسباتك لا تُنسى.
                </p>

                {/* Contact Info */}
                <div className="space-y-3">
                  <motion.div 
                    className="flex items-center group cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <div 
                      className="p-2 rounded-lg mr-3"
                      style={{ backgroundColor: 'rgba(192, 155, 82, 0.2)' }}
                    >
                      <Phone className="w-4 h-4" style={{ color: '#C09B52' }} />
                    </div>
                    <span className="text-gray-300 mr-3 group-hover:text-white transition-colors" dir="ltr">
                      +966 59 270 6600
                    </span>
                  </motion.div>

                  <motion.div 
                    className="flex items-center group cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <div 
                      className="p-2 rounded-lg mr-3"
                      style={{ backgroundColor: 'rgba(192, 155, 82, 0.2)' }}
                    >
                      <Mail className="w-4 h-4" style={{ color: '#C09B52' }} />
                    </div>
                    <span onClick={() => window.open('mailto:customersupport@myinvitation-sa.com')} className="text-gray-300 mr-3 group-hover:text-white transition-colors" dir="ltr">
                      customersupport@myinvitation-sa.com
                    </span>
                  </motion.div>

                  <motion.div 
                    className="flex items-center group cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    <div 
                      className="p-2 rounded-lg mr-3"
                      style={{ backgroundColor: 'rgba(192, 155, 82, 0.2)' }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: '#C09B52' }} />
                    </div>
                    <span className="text-gray-300 mr-3 group-hover:text-white transition-colors">
                      جدة، المملكة العربية السعودية
                    </span>
                  </motion.div>
                </div>

                {/* Company Information */}
                <div className="space-y-2 mt-6 pt-6 border-t border-gray-800">
                  <p className="text-gray-300 text-sm">
                    شركة أساس التواصل
                  </p>
                  <p className="text-gray-400 text-xs" dir="ltr">
                    السجل التجاري 4030467059
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Services */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <span style={{ color: '#C09B52' }}>خدماتنا</span>
                <motion.div 
                  className="w-8 h-0.5 mr-3"
                  style={{ backgroundColor: '#C09B52' }}
                  animate={{ width: [0, 32, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </h3>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <motion.li 
                    key={index}
                    className="group cursor-pointer"
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-2 ">
                      <motion.div 
                        className="w-1.5 ml-3 h-1.5 rounded-full group-hover:w-3 transition-all duration-300"
                        style={{ backgroundColor: '#C09B52' }}
                      />
                      <span className="text-gray-300 mr-3 group-hover:text-white transition-colors">
                        {service}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <span style={{ color: '#C09B52' }}>روابط سريعة</span>
                <motion.div 
                  className="w-8 h-0.5 mr-3"
                  style={{ backgroundColor: '#C09B52' }}
                  animate={{ width: [0, 32, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
                />
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {quickLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link 
                      href={link.href}
                      className="flex items-center space-x-2  group"
                    >
                      <motion.div 
                        className="w-1.5 ml-3 h-1.5 rounded-full group-hover:w-3 transition-all duration-300"
                        style={{ backgroundColor: '#C09B52' }}
                      />
                      <span className="text-gray-300 mr-3 group-hover:text-white transition-colors">
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className="border-t border-gray-800 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            
            {/* Copyright and Legal Links */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-400">
                  <span>&copy; منصة  MY INVITATION.</span>
                  <span>جميع الحقوق محفوظة.</span>
                </div>
              </div>
              
              {/* Legal Links */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link 
                  href="/privacy" 
                  className="text-gray-400 hover:text-[#C09B52] transition-colors duration-300"
                >
                  سياسة الخصوصية
                </Link>
                <span className="text-gray-600">|</span>
                <Link 
                  href="/terms" 
                  className="text-gray-400 hover:text-[#C09B52] transition-colors duration-300"
                >
                  الشروط والأحكام
                </Link>
                <span className="text-gray-600">|</span>
                <Link 
                  href="/data-deletion" 
                  className="text-gray-400 hover:text-[#C09B52] transition-colors duration-300"
                >
                  حذف البيانات
                </Link>
              </div>
            </div>

            {/* Back to Top */}
            <motion.button
              onClick={scrollToTop}
              className="p-3 rounded-full border-2 hover:border-yellow-500 transition-all duration-300 group"
              style={{ borderColor: '#C09B52', backgroundColor: 'rgba(192, 155, 82, 0.1)' }}
              whileHover={{ 
                scale: 1.1,
                backgroundColor: '#C09B52'
              }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowUp className="w-5 h-5 group-hover:text-black transition-colors" style={{ color: '#C09B52' }} />
            </motion.button>
          </div>
        </motion.div>

        {/* Powered by Section */}
        <motion.div 
          className="border-t border-gray-800 py-4 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <p className="text-gray-500 text-sm">
            Powered by{' '}
            <motion.a
              href="https://www.outsourcing-eg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors duration-300"
              style={{ color: '#ff6600' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              5D Outsourcing
            </motion.a>
          </p>
        </motion.div>
      </div>

      {/* Bottom Glow Line */}
      <motion.div 
        className="h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.5, delay: 1 }}
        style={{ background: `linear-gradient(to right, transparent, #C09B52, transparent)` }}
      />
    </footer>
  );
}