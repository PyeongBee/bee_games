import { Swords, Grid } from 'lucide-react';

export default function Home() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen gap-10'>
      <h1 className='text-3xl font-bold text-gray-800 mb-2'>Bee Games</h1>
      <div className='flex flex-row gap-8'>
        {/* 기사의 여행 카드 */}
        <div className='flex flex-col items-center w-72 p-6 bg-white rounded-xl border shadow hover:shadow-lg transition-shadow'>
          {/* lucide-react에 knight(체스 말) 아이콘이 생기면 Swords 대신 교체 */}
          <Swords className='w-14 h-14 text-amber-700 mb-3' />
          <h2 className='text-xl font-bold text-amber-800 mb-2'>기사의 여행</h2>
          <p className='text-gray-600 text-center mb-4 text-sm'>
            NxN 체스판에서 나이트가 모든 칸을 한 번씩만 방문하면 승리하는 퍼즐 게임입니다.
          </p>
          <a
            href='/knights-tour'
            className='mt-auto px-5 py-2 bg-yellow-400 text-white rounded-lg font-semibold shadow hover:bg-yellow-500 transition-colors'
          >
            게임 시작
          </a>
        </div>
        {/* 벽바둑 카드 */}
        <div className='flex flex-col items-center w-72 p-6 bg-white rounded-xl border shadow hover:shadow-lg transition-shadow'>
          <Grid className='w-14 h-14 text-blue-700 mb-3' />
          <h2 className='text-xl font-bold text-blue-800 mb-2'>벽바둑</h2>
          <p className='text-gray-600 text-center mb-4 text-sm'>
            돌을 움직이고 벽을 설치해 영역을 나누는 전략 보드게임입니다. 상대보다 더 넓은 영역을 차지해보세요!
          </p>
          <a
            href='/wall-baduk'
            className='mt-auto px-5 py-2 bg-blue-400 text-white rounded-lg font-semibold shadow hover:bg-blue-500 transition-colors'
          >
            게임 시작
          </a>
        </div>
      </div>
    </div>
  );
}
