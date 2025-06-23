// import Image from 'next/image';

export default function Home() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-8'>
      <h1 className='text-3xl font-bold text-gray-800'>기사의 여행</h1>
      <p className='text-gray-600 text-center max-w-md'>
        NxN 체스판에서 나이트가 모든 칸을 한 번씩만 방문하면 승리하는 퍼즐 게임입니다.
        <br />
        좌측 메뉴에서 게임을 선택해 시작하세요.
      </p>
      <a
        href='/knights-tour'
        className='mt-4 px-6 py-2 bg-yellow-400 text-white rounded-lg font-semibold shadow hover:bg-yellow-500 transition-colors'
      >
        게임 시작
      </a>
    </div>
  );
}
