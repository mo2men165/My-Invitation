// components/contact/ContactFormSection.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, User, Mail, MessageSquare, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { contactAPI, type ContactFormData } from '@/lib/api/contact';

export function ContactFormSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.fade-in-element');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await contactAPI.submitForm(formData);

      if (response.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        
        // Reset status after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        throw new Error(response.error?.message || 'حدث خطأ أثناء الإرسال');
      }
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      
      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects = [
    'استفسار عام',
    'طلب عرض سعر',
    'دعم فني',
    'شراكة تجارية',
    'شكوى أو اقتراح',
    'أخرى'
  ];

  return (
    <section ref={sectionRef} className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: '#C09B52',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-[#C09B52]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Contact Info */}
          <div className="space-y-8">
            {/* Section Header */}
            <div className="fade-in-element opacity-0 transform translate-y-8">
              <div className="flex items-center space-x-3  mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-black" />
                </div>
                <div className="h-px bg-gradient-to-r from-[#C09B52] to-transparent flex-1"></div>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                تواصل <span className="text-[#C09B52]">معنا</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                نحن هنا لمساعدتك في جعل مناسبتك استثنائية. تواصل معنا وسنكون سعداء للإجابة على جميع استفساراتك.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.2s' }}>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500 group">
                  <div className="flex items-center space-x-4 ">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg group-hover:text-[#C09B52] transition-colors duration-300">
                        اتصل بنا
                      </h3>
                      <p dir="ltr" className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        +966 59 270 6600
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#C09B52]/30 transition-all duration-500 group">
                  <div className="flex items-center space-x-4 ">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg group-hover:text-[#C09B52] transition-colors duration-300">
                        راسلنا
                      </h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      customersupport@myinvitation-sa.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.4s' }}>
                <div className="bg-gradient-to-r from-[#C09B52]/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-6 border border-[#C09B52]/20 hover:border-[#C09B52]/40 transition-all duration-500 group">
                  <div className="flex items-center space-x-4 ">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        دعم سريع
                      </h3>
                      <p className="text-gray-300">
                        نجيب خلال 24 ساعة
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="fade-in-element opacity-0 transform translate-y-8" style={{ animationDelay: '0.5s' }}>
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#C09B52]/20 to-amber-600/20 rounded-3xl blur-2xl opacity-50"></div>
              
              {/* Form Container */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center space-x-3 ">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-300">تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 ">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300">حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name & Email Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-white font-medium">
                        الاسم الكامل <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm focus:border-[#C09B52] focus:ring-2 focus:ring-[#C09B52]/20 transition-all"
                          placeholder="أدخل اسمك الكامل"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-white font-medium">
                        البريد الإلكتروني <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm focus:border-[#C09B52] focus:ring-2 focus:ring-[#C09B52]/20 transition-all"
                          placeholder="example@email.com"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone & Subject Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-white font-medium">
                        رقم الهاتف
                      </label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm focus:border-[#C09B52] focus:ring-2 focus:ring-[#C09B52]/20 transition-all"
                          placeholder="501234567"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-white font-medium">
                        الموضوع <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 text-white rounded-xl backdrop-blur-sm focus:border-[#C09B52] focus:ring-2 focus:ring-[#C09B52]/20 transition-all"
                        dir="rtl"
                      >
                        <option value="" className="bg-gray-800">اختر الموضوع</option>
                        {subjects.map((subject) => (
                          <option key={subject} value={subject} className="bg-gray-800">
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-white font-medium">
                      الرسالة <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute right-3 top-4 w-5 h-5 text-gray-400" />
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm focus:border-[#C09B52] focus:ring-2 focus:ring-[#C09B52]/20 transition-all resize-none"
                        placeholder="اكتب رسالتك هنا..."
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#C09B52]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3 "
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>إرسال الرسالة</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}