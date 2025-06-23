import { Swords, Grid } from 'lucide-react';

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
  return (
    <aside className='fixed left-0 top-0 h-full w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 shadow-sm z-20'>
      <div className='flex flex-col gap-6 w-full items-center'>
        {/* 로고 또는 플랫폼 아이콘 */}
        <div className='mb-8 mt-2'>
          <span className='text-2xl font-bold text-yellow-500'>🐝</span>
        </div>
        {/* 게임 목록 */}
        <nav className='flex flex-col gap-6 w-full items-center'>
          {games.map((game) => (
            <a
              key={game.name}
              href={game.href}
              className='flex flex-col items-center gap-1 text-gray-700 hover:text-yellow-500 transition-colors group'
            >
              <game.icon className='w-7 h-7 group-hover:scale-110 transition-transform' />
              <span className='text-xs mt-1 whitespace-nowrap font-medium'>{game.name}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
