'use client';

import Sidebar from './Sidebar';
import React, { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar />
      <main className={`flex-1 p-6 transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-20'}`}>{children}</main>
    </div>
  );
}
