'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '../ui/AppIcon';

const Header = () => {
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('SP');
  const [userRole, setUserRole] = useState<string>('Manager');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'ChartBarIcon' },
    { name: 'Visit Form', href: '/visit-form', icon: 'ClipboardDocumentListIcon' },
    { name: 'Catalogue', href: '/catalogue', icon: 'ShoppingBagIcon' },
    { name: 'Analytics', href: '/analytics-center', icon: 'ChartPieIcon' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors, we'll still clear client state
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('stpro_user');
      } catch {
        // ignore
      }
    }

    setIsProfileMenuOpen(false);
    router.push('/login');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('stpro_user');
      if (!raw) return;

      const stored = JSON.parse(raw) as {
        displayName?: string | null;
        email?: string | null;
        role?: string | null;
      };

      const name = stored.displayName || null;

      if (name) {
        setUserName(name);
        const parts = name.split(' ').filter(Boolean);
        const initials = parts
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        if (initials) {
          setUserInitials(initials);
        }
      }

      if (stored.role) {
        if (stored.role === 'admin') {
          setUserRole('Admin');
        } else if (stored.role === 'commercial') {
          setUserRole('Commercial');
        } else if (stored.role === 'consultant') {
          setUserRole('Consultant');
        } else {
          setUserRole(stored.role);
        }
      }
    } catch {
      // En cas d'erreur de parsing, on garde les valeurs par défaut
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-elevated border-b border-border backdrop-blur-sm">
      <div className="flex items-center justify-between h-20 px-4 lg:px-8">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center space-x-4 group">
          <div className="relative">
            <img 
              src="/assets/images/rfidia.png" 
              alt="RFIDIA Technology" 
              className="h-12 w-auto object-contain transform transition-smooth group-hover:scale-105"
            />
          </div>
          <div className="hidden lg:block h-10 w-px bg-border"></div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-display font-bold text-gradient-rfidia tracking-tight">
              SalesTracker Pro
            </h1>
            <p className="text-xs text-text-secondary font-body">Powered by RFIDIA Technology</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-2">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-cta font-medium text-text-secondary hover:text-primary hover:bg-gradient-rfidia-subtle transition-smooth group relative overflow-hidden"
            >
              <Icon
                name={item.icon as any}
                size={20}
                className="text-text-secondary group-hover:text-primary transition-smooth relative z-10"
              />
              <span className="relative z-10">{item.name}</span>
              <div className="absolute inset-0 bg-gradient-rfidia opacity-0 group-hover:opacity-5 transition-smooth"></div>
            </Link>
          ))}
        </nav>

        {/* Right Section - Desktop */}
        <div className="hidden lg:flex items-center space-x-4">
          <button className="relative p-2.5 rounded-xl text-text-secondary hover:text-primary hover:bg-gradient-rfidia-subtle transition-smooth">
            <Icon name="BellIcon" size={22} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-white"></span>
          </button>

          <div className="w-px h-8 bg-border"></div>

          <div className="relative">
            <button
              type="button"
              onClick={toggleProfileMenu}
              className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gradient-rfidia-subtle transition-smooth group"
            >
              <div className="w-10 h-10 gradient-rfidia rounded-full flex items-center justify-center text-sm font-display font-semibold text-white shadow-elevated">
                {userInitials}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-sm font-cta font-semibold text-text-primary">{userName ?? 'Sales Pro'}</p>
                <p className="text-xs text-text-secondary">{userRole}</p>
              </div>
              <Icon
                name="ChevronDownIcon"
                size={16}
                className="text-text-secondary group-hover:text-primary transition-smooth"
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl shadow-prominent py-2 text-sm z-50">
                <Link
                  href="/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full px-4 py-2.5 text-left text-text-secondary hover:text-primary hover:bg-gradient-rfidia-subtle transition-smooth flex items-center gap-3"
                >
                  <Icon name="UserIcon" size={18} />
                  <span>Mon Profil</span>
                </Link>
                <div className="h-px bg-border my-2 mx-3"></div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-error hover:text-white hover:bg-error/10 transition-smooth flex items-center gap-3"
                >
                  <Icon name="ArrowRightOnRectangleIcon" size={18} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2.5 rounded-xl text-text-secondary hover:text-primary hover:bg-gradient-rfidia-subtle transition-smooth"
          aria-label="Toggle mobile menu"
        >
          <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-border animate-slide-in-from-top shadow-prominent">
          <nav className="px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-cta font-medium text-text-secondary hover:text-primary hover:bg-gradient-rfidia-subtle transition-smooth"
              >
                <Icon name={item.icon as any} size={20} className="text-text-secondary" />
                <span>{item.name}</span>
              </Link>
            ))}

            <div className="pt-4 border-t border-border space-y-2">
              <Link 
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-cta font-medium hover:bg-gradient-rfidia-subtle transition-smooth"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 gradient-rfidia rounded-full flex items-center justify-center text-sm font-display font-semibold text-white shadow-elevated">
                    {userInitials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-cta font-semibold text-text-primary">{userName ?? 'Sales Pro'}</p>
                    <p className="text-xs text-text-secondary">{userRole}</p>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-cta font-medium text-error hover:bg-error/10 transition-smooth"
              >
                <span>Se déconnecter</span>
                <Icon name="ArrowRightOnRectangleIcon" size={18} className="text-error" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;