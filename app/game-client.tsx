'use client';

import dynamic from 'next/dynamic';
import { AuthPanel } from '../components/web/AuthPanel';

const LegacyGame = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => <p className="boot-message">ゲームを準備しています…</p>,
});

export default function GameClient() {
  return <main className="app-shell"><AuthPanel /><LegacyGame /></main>;
}
