'use client';
import Link from 'next/link';
import Image from 'next/image';
import { GitCompare, Heart, ShoppingCart, LogOut, Settings, ChevronDown, Shield, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/authSlice';
import { fetchCart } from '@/store/cartSlice';
import { fetchWishlist } from '@/store/wishlistSlice';
import { fetchCompareList } from '@/store/compareSlice';
import { usePathname } from 'next/navigation';
import { navLinks } from '@/constants';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const dispatch = useAppDispatch();
  
  // Get Redux state for cart, wishlist, compare
  const { items: cartItems, count: cartCount } = useAppSelector((state) => state.cart);
  const { count: wishlistCount } = useAppSelector((state) => state.wishlist);
  const { count: compareCount } = useAppSelector((state) => state.compare);
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Initialize data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      dispatch(fetchCompareList());
    }
  }, [isAuthenticated, user, dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    dispatch(logout());
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Smart truncation function that handles Arabic and English text
  const smartTruncate = (text: string, maxLength: number = 12) => {
    if (!text || text.length <= maxLength) return text;
    
    // Check if text contains Arabic characters
    const arabicRegex = /[\u0600-\u06FF]/;
    const isArabic = arabicRegex.test(text);
    
    if (isArabic) {
      // For Arabic: truncate from the end and add ellipsis at the beginning
      return `...${text.slice(-(maxLength - 3))}`;
    } else {
      // For English: truncate from the beginning and add ellipsis at the end
      return `${text.slice(0, maxLength - 3)}...`;
    }
  };


  const UserSection = () => {
    if (isLoading || !isInitialized) {
      return (
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
        </div>
      );
    }

    if (isAuthenticated && user) {
      // Smart truncation for display name
      const displayName = smartTruncate(user.firstName || '', 10);
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const truncatedFullName = smartTruncate(fullName, 20);
      const truncatedEmail = smartTruncate(user.email || '', 25);

      return (
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="group flex items-center mr-3"
          >
            <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-full px-2 py-2 hover:border-[#C09B52] transition-all duration-300 hover:shadow-lg hover:shadow-[#C09B52]/20 min-w-[120px]">
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              <span 
                className="text-xs font-medium text-gray-300 group-hover:text-[#C09B52] transition-colors duration-300 max-w-[70px] overflow-hidden whitespace-nowrap" 
                title={`مرحباً، ${user.firstName}`}
                style={{
                  textOverflow: 'ellipsis',
                  direction: /[\u0600-\u06FF]/.test(user.firstName || '') ? 'rtl' : 'ltr'
                }}
              >
                مرحباً، {displayName}
              </span>
              <div className="w-7 h-7 mr-2 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-black">
                  {user.firstName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute top-full mt-2 left-0 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-black">
                      {user.firstName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 mr-3">
                    <p 
                      className="text-white font-medium overflow-hidden whitespace-nowrap"
                      title={fullName}
                      style={{
                        textOverflow: 'ellipsis',
                        direction: /[\u0600-\u06FF]/.test(fullName) ? 'rtl' : 'ltr'
                      }}
                    >
                      {truncatedFullName}
                    </p>
                    <p 
                      className="text-gray-400 text-sm overflow-hidden whitespace-nowrap"
                      title={user.email}
                      style={{
                        textOverflow: 'ellipsis',
                        direction: 'ltr' // Email is always LTR
                      }}
                    >
                      {truncatedEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-[#C09B52] hover:bg-gray-800 transition-all duration-200"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <span className='mr-2'>لوحة الإدارة</span>
                  </Link>
                )}
                
                <Link
                  href="/events"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-[#C09B52] hover:bg-gray-800 transition-all duration-200"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  <span className='mr-2'>المناسبات</span>
                </Link>
                
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-[#C09B52] hover:bg-gray-800 transition-all duration-200"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className='mr-2'>لوحة التحكم</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className='mr-2'>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Not authenticated
    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/login"
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-[#C09B52] transition-colors duration-300 font-medium"
        >
          تسجيل الدخول
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-full hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-[#C09B52]/30"
        >
          إنشاء حساب
        </Link>
      </div>
    );
  };

  return (
    <header className="bg-gray-900/60 border-b border-gray-700 sticky top-0 z-50 shadow-lg shadow-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-4">
        <div className="grid grid-cols-2 items-center min-h-[50px]">
          
          {/* Logo - Left Side */}
          <div className="flex justify-center">
            <Link href="/" className="block">
              <Image 
                src="/logo.png" 
                alt="Invitation Logo" 
                width={120} 
                height={60}
                className="h-18 w-auto"
              />
            </Link>
          </div>

          {/* Menu Button & Cart - All Screen Sizes */}
          <div className="flex items-center justify-end gap-3" ref={mobileMenuRef}>
            {/* Cart Icon - Simple on mobile, with total on md+ */}
            {isAuthenticated && isInitialized && (
              <>
                {/* Simple cart icon for mobile */}
                <Link href="/cart" className="relative p-2 md:hidden">
                  <ShoppingCart className="w-6 h-6 text-gray-300 hover:text-[#C09B52] transition-colors duration-300" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#C09B52] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-black">
                      {cartCount}
                    </span>
                  )}
                </Link>
                
                {/* Cart with total for md+ screens */}
                <Link href="/cart" className="hidden md:block group relative">
                  <div className="relative flex items-center bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-full px-3 py-2 hover:border-[#C09B52] transition-all duration-300 hover:shadow-lg hover:shadow-[#C09B52]/20 min-w-[110px]">
                    <div className="relative ml-2">
                      <ShoppingCart className="w-4 h-4 text-gray-300 group-hover:text-[#C09B52] transition-colors duration-300" />
                      {/* Cart items badge */}
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#C09B52] text-black text-xs rounded-full w-3 h-3 flex items-center justify-center font-bold">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-none">المجموع</span>
                      <span className="text-xs font-bold text-[#C09B52] group-hover:text-amber-300 transition-colors duration-300 leading-none mt-0.5">
                        {cartTotal.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-[#C09B52]/10 rounded-full transform scale-0 group-hover:scale-105 transition-transform duration-300 -z-10" />
                  </div>
                </Link>
              </>
            )}
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-gray-300 hover:text-[#C09B52] transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-black border-t border-gray-800 shadow-2xl z-50 max-h-[80vh] overflow-y-auto scrollbar-hide">
                <div className="container mx-auto px-8 py-6">
                  
                  {/* Navigation Links */}
                  <nav className="mb-6">
                    <div className="space-y-2">
                      {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block py-3 px-4 rounded-lg text-lg font-medium transition-all duration-300 hover:bg-gray-800 ${
                              isActive ? 'text-[#C09B52] bg-gray-800/50' : 'text-gray-300 hover:text-[#C09B52]'
                            }`}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                      
                      {/* Events Link */}
                      {isAuthenticated && (
                        <Link
                          href="/events"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block py-3 px-4 rounded-lg text-lg font-medium transition-all duration-300 hover:bg-gray-800 ${
                            pathname === '/events' ? 'text-[#C09B52] bg-gray-800/50' : 'text-gray-300 hover:text-[#C09B52]'
                          }`}
                        >
                          المناسبات
                        </Link>
                      )}
                    </div>
                  </nav>

                  {/* User Section */}
                  {isAuthenticated && isInitialized && user ? (
                    <>
                      {/* User Info */}
                      <div className="border-t border-gray-800 pt-6 mb-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C09B52] to-amber-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-black">
                              {user.firstName?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate" title={`${user.firstName} ${user.lastName}`}>
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-gray-400 text-sm truncate" title={user.email}>
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* User Actions */}
                        <div className="space-y-2">
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-300 hover:text-[#C09B52] hover:bg-gray-800 transition-all duration-200"
                            >
                              <Shield className="w-5 h-5 flex-shrink-0" />
                              <span>لوحة الإدارة</span>
                            </Link>
                          )}
                          
                          <Link
                            href="/dashboard"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-300 hover:text-[#C09B52] hover:bg-gray-800 transition-all duration-200"
                          >
                            <Settings className="w-5 h-5 flex-shrink-0" />
                            <span>لوحة التحكم</span>
                          </Link>
                          
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-red-400 hover:text-red-300 hover:bg-gray-800 transition-all duration-200"
                          >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span>تسجيل الخروج</span>
                          </button>
                        </div>
                      </div>

                      {/* Shopping Actions */}
                      <div className="border-t border-gray-800 pt-6">
                        <h3 className="text-gray-400 text-sm font-medium mb-4 px-4">التسوق</h3>
                        <div className="space-y-2">
                          {/* Wishlist */}
                          <Link
                            href="/wishlist"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-3 px-4 rounded-lg text-gray-300 hover:text-[#C09B52] hover:bg-gray-800 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Heart className="w-5 h-5" />
                                {wishlistCount > 0 && (
                                  <span className="absolute -top-1.5 -right-1.5 bg-[#C09B52] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {wishlistCount}
                                  </span>
                                )}
                              </div>
                              <span>المفضلة</span>
                            </div>
                            <span className="text-sm text-gray-400">{wishlistCount} عناصر</span>
                          </Link>

                          {/* Compare */}
                          <Link
                            href="/compare"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-3 px-4 rounded-lg text-gray-300 hover:text-[#C09B52] hover:bg-gray-800 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <GitCompare className="w-5 h-5" />
                                {compareCount > 0 && (
                                  <span className="absolute -top-1.5 -right-1.5 bg-[#C09B52] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {compareCount}
                                  </span>
                                )}
                              </div>
                              <span>المقارنة</span>
                            </div>
                            <span className="text-sm text-gray-400">{compareCount} عناصر</span>
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Not Authenticated Actions */
                    <div className="border-t border-gray-800 pt-6">
                      <div className="space-y-3">
                        <Link
                          href="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block w-full py-3 px-6 text-center border border-[#C09B52] text-[#C09B52] rounded-xl font-medium hover:bg-[#C09B52] hover:text-black transition-all duration-300"
                        >
                          تسجيل الدخول
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block w-full py-3 px-6 text-center bg-gradient-to-r from-[#C09B52] to-amber-600 text-black font-bold rounded-xl hover:from-amber-600 hover:to-[#C09B52] transition-all duration-300"
                        >
                          إنشاء حساب جديد
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium glow line at bottom */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C09B52]/50 to-transparent" />
    </header>
  );
}