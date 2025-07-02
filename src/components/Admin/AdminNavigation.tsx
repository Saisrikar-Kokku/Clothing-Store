'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Home,
  Settings,
  Package,
  Clock
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LogoutButton from '../LogoutButton';

export default function AdminNavigation() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const adminNavItems = [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overview and analytics'
    },
    { 
      href: '/admin/inventory', 
      label: 'Inventory', 
      icon: ShoppingBag,
      description: 'Manage products and stock'
    },
    { 
      href: '/admin/suppliers', 
      label: 'Suppliers', 
      icon: Users,
      description: 'Supplier information and dues'
    },
    { 
      href: '/admin/sales', 
      label: 'Sales', 
      icon: TrendingUp,
      description: 'Sales reports and analytics'
    },
    { 
      href: '/admin/pending-payments', 
      label: 'Pending Payments', 
      icon: Clock,
      description: 'Customer payment tracking'
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo and Admin Nav Links */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl sm:text-2xl font-extrabold harika-gradient-heading harika-gradient-move" style={{ letterSpacing: '0.03em', lineHeight: 1.1 }}>
                  Harika Clothing Store
                </h1>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={item.description}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {item.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: User info, alerts, and logout */}
          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Package className="w-4 h-4 text-red-500" />
                <span>3 Low Stock</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>4 Pending</span>
              </div>
            </div>

            {/* Back to Store */}
            <Link 
              href="/" 
              className="hidden sm:flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>

            {/* User info and logout */}
            {userEmail && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-700 max-w-[140px] truncate" title={userEmail}>
                    {userEmail}
                  </span>
                </div>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
} 