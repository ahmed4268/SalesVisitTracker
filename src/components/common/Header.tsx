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
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 shadow-elevated border-b border-gray-700 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center transform transition-smooth group-hover:scale-105 group-hover:rotate-3">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-display font-bold text-white tracking-tight">
              SalesTracker Pro
            </h1>
            <p className="text-xs text-white/80 font-body">Luxury Technology</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-cta font-medium text-white/80 hover:text-white hover:bg-primary/10 transition-smooth group"
            >
              <Icon
                name={item.icon as any}
                size={20}
                className="text-white group-hover:text-accent transition-smooth"
              />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Right Section - Desktop */}
        <div className="hidden lg:flex items-center space-x-4 text-white">
          <button className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-primary/10 transition-smooth">
            <Icon name="BellIcon" size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>

          <div className="w-px h-6 bg-white/20"></div>

          <div className="relative">
            <button
              type="button"
              onClick={toggleProfileMenu}
              className="flex items-center space-x-3 p-2 rounded-lg text-white hover:bg-primary/10 transition-smooth group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-sm font-display font-semibold text-white">
                {userInitials}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-sm font-cta font-semibold text-white">{userName ?? 'Sales Pro'}</p>
                <p className="text-xs text-white/80">{userRole}</p>
              </div>
              <Icon
                name="ChevronDownIcon"
                size={16}
                className="text-white/80 group-hover:text-white transition-smooth"
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 text-sm">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-white/80 hover:text-white hover:bg-primary/20 transition-smooth flex items-center gap-2"
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
          className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-primary/10 transition-smooth"
          aria-label="Toggle mobile menu"
        >
          <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-primary/95 border-t border-border/30 animate-slide-in-from-top">
          <nav className="px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-cta font-medium text-white/80 hover:text-white hover:bg-primary/20 transition-smooth"
              >
                <Icon name={item.icon as any} size={20} className="text-white" />
                <span>{item.name}</span>
              </Link>
            ))}

            <div className="pt-4 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-cta font-medium text-white/80">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-sm font-display font-semibold text-white">
                    {userInitials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-cta font-semibold text-white">{userName ?? 'Sales Pro'}</p>
                    <p className="text-xs text-white/80">{userRole}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-cta font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-smooth"
              >
                <span>Se déconnecter</span>
                <Icon name="ArrowRightOnRectangleIcon" size={18} className="text-red-400" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;