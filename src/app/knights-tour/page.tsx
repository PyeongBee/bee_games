'use client';

import { useState, useEffect, useRef } from 'react';
import { Swords } from 'lucide-react';

const BOARD_SIZES = [5, 6, 7, 8];
const TIMER_OPTIONS = [0, 15, 30, 60];
const moves = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

function getNextMoves(knight: [number, number], visited: boolean[][]) {
  const N = visited.length;
  const [kx, ky] = knight;
  return moves
    .map(([dx, dy]) => [kx + dx, ky + dy] as [number, number])
    .filter(([x, y]) => x >= 0 && x < N && y >= 0 && y < N && !visited[x][y]);
}

export default function KnightsTour() {
  const [boardSize, setBoardSize] = useState(8);
  const N = boardSize;
  const [knight, setKnight] = useState<[number, number] | null>(null);
  const [visited, setVisited] = useState(Array.from({ length: N }, () => Array(N).fill(false)));
  const [moveCount, setMoveCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [timer, setTimer] = useState(timerSec);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [failReason, setFailReason] = useState<null | 'timeout' | 'no-move' | 'success'>(null);
  const [showRules, setShowRules] = useState(false);

  // 타이머 옵션 변경 시 초기화
  function handleTimerChange(sec: number) {
    setTimerSec(sec);
    setTimer(sec);
  }

  // 보드 크기 변경 시 상태 초기화
  function handleSizeChange(size: number) {
    setBoardSize(size);
    setKnight(null);
    setVisited(Array.from({ length: size }, () => Array(size).fill(false)));
    setMoveCount(0);
    setGameOver(false);
    setStarted(false);
    setTimer(timerSec);
  }

  // 타이머 관리
  useEffect(() => {
    if (!started || gameOver || timerSec === 0) return;
    setTimer(timerSec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [moveCount, started, gameOver, timerSec]);

  // 타임아웃 시 실패 처리
  useEffect(() => {
    if (!started || gameOver || timerSec === 0) return;
    if (timer <= 0) {
      setGameOver(true);
      setFailReason('timeout');
    }
    // eslint-disable-next-line
  }, [timer, timerSec]);

  // 누적 타이머 관리
  useEffect(() => {
    if (started && !gameOver) {
      totalTimerRef.current = setInterval(() => {
        setTotalTime((t) => t + 1);
      }, 1000);
    } else if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
    }
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [started, gameOver]);

  function handleCellClick(x: number, y: number, force = false) {
    if (!started) {
      setKnight([x, y]);
      const newVisited = Array.from({ length: N }, () => Array(N).fill(false));
      newVisited[x][y] = true;
      setVisited(newVisited);
      setMoveCount(1);
      setStarted(true);
      setGameOver(false);
      setFailReason(null);
      setTimer(timerSec);
      return;
    }
    if (gameOver || !knight) return;
    const [kx, ky] = knight;
    const isKnightMove = moves.some(([dx, dy]) => kx + dx === x && ky + dy === y);
    if ((!isKnightMove || visited[x][y]) && !force) return;
    const newVisited = visited.map((row) => [...row]);
    newVisited[x][y] = true;
    setKnight([x, y]);
    setVisited(newVisited);
    setMoveCount(moveCount + 1);
    setTimer(timerSec);
    if (moveCount + 1 === N * N) {
      setGameOver(true);
      setFailReason('success');
      return;
    }
    // 이동 후 더 이상 이동할 곳이 없으면 실패 처리
    const nextMoves = getNextMoves([x, y], newVisited);
    if (nextMoves.length === 0) {
      setGameOver(true);
      setFailReason('no-move');
    }
  }

  function handleReset() {
    setKnight(null);
    setVisited(Array.from({ length: N }, () => Array(N).fill(false)));
    setMoveCount(0);
    setGameOver(false);
    setStarted(false);
    setTimer(timerSec);
    setTotalTime(0);
    setFailReason(null);
  }

  return (
    <div className='flex flex-col items-center gap-4 md:gap-6 p-4'>
      <div className='flex items-center gap-3 mb-2'>
        <h2 className='text-xl md:text-2xl font-bold text-amber-800'>기사의 여행</h2>
        <button
          onClick={() => setShowRules(true)}
          className='px-3 py-1 text-xs md:text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors font-medium'
        >
          게임규칙
        </button>
      </div>

      {/* 홈페이지 스타일 게임 설명 */}
      <p className='text-sm md:text-base text-gray-600 text-center max-w-md'>
        체스의 기사처럼 L자 모양으로 이동하며 모든 칸을 한 번씩 방문하는 퍼즐 게임입니다.
      </p>

      <div className='flex gap-2 mb-2'>
        {BOARD_SIZES.map((size) => (
          <button
            key={size}
            className={`px-3 py-1 rounded border text-sm font-semibold transition-colors
              ${
                boardSize === size
                  ? 'bg-yellow-400 text-white border-yellow-500'
                  : 'bg-white border-gray-300 hover:bg-yellow-100'
              }
              ${started ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !started && handleSizeChange(size)}
            disabled={started}
          >
            {size}x{size}
          </button>
        ))}
      </div>
      <div className='flex gap-2 mb-2 items-center'>
        {TIMER_OPTIONS.map((sec) => (
          <button
            key={sec}
            className={`px-3 py-1 rounded border text-sm font-semibold transition-colors
              ${
                timerSec === sec
                  ? 'bg-blue-400 text-white border-blue-500'
                  : 'bg-white border-gray-300 hover:bg-blue-100'
              }
              ${started ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !started && handleTimerChange(sec)}
            disabled={started}
          >
            {sec === 0 ? '없음' : `${sec}초`}
          </button>
        ))}
        {started && !gameOver && timerSec > 0 && (
          <span className='ml-2 text-lg font-bold text-blue-700'>⏰ {timer}</span>
        )}
      </div>
      <div className='flex flex-col items-center gap-2'>
        <div
          className='border-2 border-gray-400 grid'
          style={{
            gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: N * N }).map((_, idx) => {
            const x = Math.floor(idx / N);
            const y = idx % N;
            const isKnight = knight && knight[0] === x && knight[1] === y;
            const isVisited = visited[x][y];
            const isNext =
              started &&
              knight &&
              !isKnight &&
              !isVisited &&
              moves.some(([dx, dy]) => knight[0] + dx === x && knight[1] + dy === y);
            return (
              <button
                key={idx}
                className={`w-10 h-10 flex items-center justify-center border border-gray-300 text-lg
                  ${
                    isKnight
                      ? 'bg-yellow-300'
                      : isVisited
                      ? 'bg-gray-200'
                      : isNext
                      ? 'bg-yellow-100 hover:bg-green-300'
                      : 'bg-white hover:bg-gray-100'
                  }
                  ${(x + y) % 2 === 0 ? '' : 'bg-gray-50'}
                  transition-colors`}
                onClick={() => handleCellClick(x, y)}
                disabled={isKnight || isVisited || gameOver || (started && !isNext)}
              >
                {isKnight ? (
                  <Swords className='w-6 h-6 text-yellow-700' />
                ) : isVisited && started ? (
                  moveCount > 1 ? (
                    '•'
                  ) : (
                    ''
                  )
                ) : (
                  ''
                )}
              </button>
            );
          })}
        </div>
        <div className='flex gap-4 mt-4 items-center'>
          <span className='text-gray-700'>이동 수: {moveCount}</span>
          <span className='text-gray-700'>⏱ {totalTime}</span>
          <button onClick={handleReset} className='px-4 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm font-medium'>
            리셋
          </button>
        </div>
        {!started && <div className='mt-4 text-blue-600 font-semibold'>시작할 위치를 선택하세요!</div>}
        {gameOver && started && failReason === 'timeout' && (
          <div className='mt-4 text-red-600 font-bold'>실패! (시간 초과)</div>
        )}
        {gameOver && started && failReason === 'no-move' && (
          <div className='mt-4 text-red-600 font-bold'>실패! (더 이상 이동할 곳이 없습니다)</div>
        )}
        {gameOver && started && failReason === 'success' && (
          <div className='mt-4 text-green-600 font-bold'>축하합니다! 모든 칸을 방문했습니다 🎉</div>
        )}
      </div>

      {/* 게임 규칙 모달 */}
      {showRules && (
        <div
          className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'
          onClick={() => setShowRules(false)}
        >
          <div
            className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-bold text-gray-800'>기사의 여행 게임 규칙</h3>
                <button
                  onClick={() => setShowRules(false)}
                  className='text-gray-500 hover:text-gray-700 text-2xl font-bold'
                >
                  ×
                </button>
              </div>

              <div className='space-y-4 text-sm md:text-base text-gray-700'>
                <div>
                  <h4 className='font-semibold text-gray-800 mb-2'>게임 목표</h4>
                  <p>
                    체스의 기사처럼 L자 모양으로 이동하여 체스판의 모든 칸을 정확히 한 번씩 방문하는 퍼즐 게임입니다.
                  </p>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-800 mb-2'>기사의 이동</h4>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>
                      <strong>L자 이동</strong>: 가로 2칸 + 세로 1칸 또는 가로 1칸 + 세로 2칸
                    </li>
                    <li>
                      <strong>8방향</strong>: 기사는 8개의 방향으로 이동할 수 있습니다
                    </li>
                    <li>
                      <strong>한 번 방문</strong>: 이미 방문한 칸은 다시 방문할 수 없습니다
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-800 mb-2'>게임 진행</h4>
                  <ol className='list-decimal list-inside space-y-2'>
                    <li>
                      <strong>보드 크기 선택</strong>: 5x5부터 8x8까지 선택 가능
                    </li>
                    <li>
                      <strong>시작 위치 선택</strong>: 체스판에서 기사를 시작할 위치를 클릭
                    </li>
                    <li>
                      <strong>기사 이동</strong>: 하이라이트된 칸을 클릭하여 기사 이동
                    </li>
                    <li>
                      <strong>완료 조건</strong>: 모든 칸을 한 번씩 방문하면 성공
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-800 mb-2'>게임 설정</h4>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>
                      <strong>타이머</strong>: 각 이동마다 제한 시간 설정 가능 (15초, 30초, 60초)
                    </li>
                    <li>
                      <strong>시간 초과</strong>: 제한 시간 내에 이동하지 못하면 실패
                    </li>
                    <li>
                      <strong>이동 불가</strong>: 더 이상 이동할 수 있는 칸이 없으면 실패
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-800 mb-2'>전략 팁</h4>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>가장자리나 모서리에서 시작하는 것이 일반적으로 유리합니다</li>
                    <li>이동 가능한 칸이 적은 칸을 우선적으로 방문하세요</li>
                    <li>중앙 지역은 나중에 방문하는 것이 좋습니다</li>
                    <li>시간 제한이 있을 때는 신속하게 판단하세요</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-800 mb-2'>역사</h4>
                  <p>
                    기사의 여행(Knight&apos;s Tour)은 수학과 체스의 고전적인 문제로, 9세기부터 연구되어 온 퍼즐입니다.
                    모든 칸을 한 번씩 방문하는 해가 존재하는지, 그리고 그 해를 찾는 방법에 대한 수학적 연구가 활발히
                    이루어져 왔습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
