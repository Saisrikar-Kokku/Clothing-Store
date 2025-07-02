'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Home, Grid, Settings, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LogoutButton from '../LogoutButton';

export default function Navigation() {
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

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/catalog', label: 'Catalog', icon: Grid },
    { href: '/admin', label: 'Admin', icon: Settings },
    { href: '/admin/inventory', label: 'Inventory', icon: ShoppingBag },
    { href: '/admin/suppliers', label: 'Suppliers', icon: Users },
    { href: '/admin/pending-payments', label: 'Pending Payments', icon: DollarSign },
    { href: '/admin/sales', label: 'Sales', icon: TrendingUp },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo and Nav Links */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl sm:text-2xl font-extrabold harika-gradient-heading harika-gradient-move" style={{ letterSpacing: '0.03em', lineHeight: 1.1 }}>
                Harika Clothing Store
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          {/* Right: User info and logout button */}
          {userEmail && (
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-700 max-w-[140px] truncate block" title={userEmail}>
                {userEmail}
              </span>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 