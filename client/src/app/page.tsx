import { HeroSection } from '@/components/Home/Hero';
import { AboutSection } from '@/components/Home/AboutSection';
import { CounterSection } from '@/components/Home/CounterSection';
import { InvitationSlider } from '@/components/Home/InvitationSlider';
import { CTA } from '@/components/Home/CTA';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'My Invitation - الصفحة الرئيسية',
  description: 'منصة شاملة لإدارة وإرسال دعوات المناسبات في المملكة العربية السعودية',
};



export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <AboutSection />
      <CounterSection />
      <InvitationSlider />
      <CTA />
    </div>
  );
}
