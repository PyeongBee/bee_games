import { Circle, Square } from 'lucide-react';

export const MAP_SIZE = 7;

// 플레이어 정보
export const players = [
  { name: '플레이어 1', color: 'text-blue-600', icon: Circle },
  { name: '플레이어 2', color: 'text-red-600', icon: Square },
];

// 초기 돌 위치 (예시: 각자 모서리)
export const initialStones: [number, number, number][] = [
  [1, 1, 0], // 플레이어 1 (파랑)
  [1, 5, 1], // 플레이어 2 (빨강)
  [5, 5, 0], // 플레이어 1 (파랑)
  [5, 1, 1], // 플레이어 2 (빨강)
];

export const TIMER_OPTIONS = [0, 15, 30, 60]; // 0: 없음(무제한)
