import { Download, Share, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Shows an install button on browsers that offer a prompt, iOS instructions on Safari, nothing once installed. */
export function InstallCard() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(isStandalone());
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('dims-challenge:install-dismissed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setStandalone(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (standalone || dismissed) return null;
  const ios = isIOS();
  if (!prompt && !ios) return null;

  const dismiss = () => { setDismissed(true); try { localStorage.setItem('dims-challenge:install-dismissed', '1'); } catch { /* ignore */ } };

  return (
    <div className="card p-4 flex items-start gap-3 border-accent/40">
      <span className="h-10 w-10 rounded-xl grad-accent text-onAccent flex items-center justify-center shrink-0"><Smartphone size={20} aria-hidden /></span>
      <div className="flex-1 min-w-0">
        <div className="font-display font-extrabold">Install on your phone</div>
        {prompt ? (
          <>
            <p className="text-xs text-fg2 mt-0.5">Full screen, its own icon, works offline.</p>
            <button className="btn-primary !min-h-10 !px-4 !text-sm mt-3" onClick={async () => { await prompt.prompt(); const c = await prompt.userChoice; if (c.outcome === 'accepted') setStandalone(true); setPrompt(null); }}><Download size={15} aria-hidden /> Install app</button>
          </>
        ) : (
          <ol className="text-xs text-fg2 mt-1 space-y-1 list-decimal pl-4">
            <li>Tap the <Share size={12} className="inline -mt-0.5" aria-label="Share" /> Share button in Safari.</li>
            <li>Choose <strong className="text-fg">Add to Home Screen</strong>.</li>
            <li>Open Dim’s Challenge from your home screen.</li>
          </ol>
        )}
      </div>
      <button className="h-8 w-8 rounded-full flex items-center justify-center text-fg3 hover:bg-surface2 shrink-0" aria-label="Dismiss" onClick={dismiss}><X size={16} /></button>
    </div>
  );
}
