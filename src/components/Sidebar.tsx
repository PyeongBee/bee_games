'use client';

import { Swords, Grid, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const games = [
  {
    name: '기사의 여행',
    icon: Swords,
    href: '/knights-tour',
  },
  {
    name: '벽바둑',
    icon: Grid,
    href: '/wall-baduk',
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false); // 데스크톱에서는 항상 열려있음
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {isMobile && isOpen && <div className='fixed inset-0 bg-black/70 z-30' onClick={closeSidebar} />}

      {/* 햄버거 메뉴 버튼 (모바일에서만 표시) */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className='fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200'
        >
          {isOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
        </button>
      )}

      {/* 사이드바 */}
      <aside
        className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 shadow-sm z-40
        transition-transform duration-300 ease-in-out
        ${isMobile ? `w-20 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}` : 'w-20'}
      `}
      >
        <div className='flex flex-col gap-6 w-full items-center'>
          {/* 로고 또는 플랫폼 아이콘 */}
          <div className='mb-8 mt-2'>
            <div onClick={isMobile ? closeSidebar : undefined}>
              <span className='text-2xl font-bold text-yellow-500'>🐝</span>
            </div>
          </div>
          {/* 게임 목록 */}
          <nav className='flex flex-col gap-6 w-full items-center'>
            {games.map((game) => (
              <Link
                key={game.name}
                href={game.href}
                onClick={closeSidebar}
                className='flex flex-col items-center gap-1 text-gray-700 hover:text-yellow-500 transition-colors group'
              >
                <game.icon className='w-7 h-7 group-hover:scale-110 transition-transform' />
                <span className='text-xs mt-1 whitespace-nowrap font-medium'>{game.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
