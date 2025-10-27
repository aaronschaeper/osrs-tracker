// components/Navigation.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Trophy } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  
  const links = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
    { href: '/competitions', label: 'Competitions', icon: Trophy },
  ];
  
  return (
    <nav className="bg-gradient-to-b from-[#2a2420] to-[#1f1a16] border-b-2 border-[#4a3a2a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center space-x-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all border-b-4 ${
                pathname === href
                  ? 'text-[#d4a76a] border-[#d4a76a] bg-[#2a2420]'
                  : 'text-[#b8a890] border-transparent hover:text-[#e6d5b8] hover:border-[#4a3a2a] hover:bg-[#2a2420]/50'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}