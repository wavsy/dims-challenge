import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { CompletionOverlay } from './components/CompletionOverlay';
import { BottomNav, Sidebar, type Tab } from './components/Nav';
import { ChallengeDetail } from './screens/ChallengeDetail';
import { Challenges } from './screens/Challenges';
import { Home } from './screens/Home';
import { Profile } from './screens/Profile';
import { Progress } from './screens/Progress';
import { StoreProvider, useStore, type CompletionResult } from './store';
import type { AttemptStatus } from './types';

const TABS: Tab[] = ['home', 'challenges', 'progress', 'profile'];

function tabFromHash(): Tab {
  const h = window.location.hash.replace('#', '');
  return (TABS as string[]).includes(h) ? (h as Tab) : 'home';
}

function Shell() {
  const { startChallenge, recordAttempt } = useStore();
  const [tab, setTab] = useState<Tab>(() => tabFromHash());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [result, setResult] = useState<CompletionResult | null>(null);

  useEffect(() => {
    const onHash = () => { setTab(tabFromHash()); setDetailId(null); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goTab = useCallback((t: Tab) => {
    setDetailId(null);
    setTab(t);
    try { if (window.location.hash !== `#${t}`) history.replaceState(null, '', `#${t}`); } catch { /* ignore */ }
    window.scrollTo({ top: 0 });
  }, []);

  const openChallenge = useCallback((id: string) => { setDetailId(id); window.scrollTo({ top: 0 }); }, []);
  const startAndOpen = useCallback((id: string) => { startChallenge(id); openChallenge(id); }, [startChallenge, openChallenge]);
  const record = useCallback((id: string, status: AttemptStatus) => { setResult(recordAttempt(id, status)); }, [recordAttempt]);

  const closeOverlay = useCallback(() => setResult(null), []);
  const toDashboard = useCallback(() => { setResult(null); goTab('home'); }, [goTab]);
  const toAnother = useCallback(() => { setResult(null); goTab('challenges'); }, [goTab]);

  return (
    <div className="min-h-full md:flex">
      <Sidebar tab={tab} onChange={goTab} />
      <main className="flex-1 min-w-0 pb-28 md:pb-10">
        <div className="gutter mx-auto w-full max-w-md md:max-w-3xl lg:max-w-4xl py-6 md:py-10">
          <AnimatePresence mode="wait" initial={false}>
            {detailId ? (
              <ChallengeDetail key={`detail-${detailId}`} id={detailId} onBack={() => setDetailId(null)} onRecord={record} />
            ) : (
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {tab === 'home' && <Home onOpenChallenge={openChallenge} onStart={startAndOpen} onBrowse={() => goTab('challenges')} />}
                {tab === 'challenges' && <Challenges onOpen={openChallenge} onStart={startAndOpen} />}
                {tab === 'progress' && <Progress onOpenChallenge={openChallenge} onBrowse={() => goTab('challenges')} />}
                {tab === 'profile' && <Profile onOpenChallenge={openChallenge} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <BottomNav tab={tab} onChange={goTab} />
      <AnimatePresence>
        {result && <CompletionOverlay key={result.attempt.id} result={result} onDashboard={toDashboard} onAnother={toAnother} onClose={closeOverlay} />}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </MotionConfig>
  );
}
