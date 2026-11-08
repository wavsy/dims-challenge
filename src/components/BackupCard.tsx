import { Check, ClipboardPaste, Copy, Download, HardDriveDownload, Upload } from 'lucide-react';
import { useState } from 'react';
import { copyText, createBackup, downloadText, parseBackup } from '../lib/backup';
import { useStore } from '../store';

export function BackupCard() {
  const { state, stats, importState } = useStore();
  const [mode, setMode] = useState<'idle' | 'import'>('idle');
  const [text, setText] = useState('');
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const doExport = async () => {
    const json = createBackup(state);
    const copied = await copyText(json);
    const downloaded = downloadText(`dims-challenge-backup-${new Date().toISOString().slice(0, 10)}.json`, json);
    if (copied) setNote({ kind: 'ok', msg: downloaded ? 'Backup copied to clipboard and downloaded.' : 'Backup copied to clipboard. Paste it somewhere safe, like a note.' });
    else if (downloaded) setNote({ kind: 'ok', msg: 'Backup downloaded.' });
    else setNote({ kind: 'err', msg: 'Couldn’t copy or download here. Try from a desktop browser.' });
  };

  const doImport = () => {
    try {
      const next = parseBackup(text);
      importState(next);
      setNote({ kind: 'ok', msg: `Restored ${next.attempts.length} logged mission${next.attempts.length === 1 ? '' : 's'}.` });
      setText('');
      setMode('idle');
    } catch (e) {
      setNote({ kind: 'err', msg: e instanceof Error ? e.message : 'Import failed.' });
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 rounded-xl bg-surface2 text-fg2 flex items-center justify-center shrink-0"><HardDriveDownload size={20} aria-hidden /></span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-extrabold">Backup &amp; restore</div>
          <p className="text-xs text-fg2 mt-0.5">Progress lives on this device. Export a copy before switching phones or clearing the browser. {stats.totalEvents} mission{stats.totalEvents === 1 ? '' : 's'} logged.</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn-secondary !min-h-11 text-sm" onClick={doExport}><Copy size={15} aria-hidden /> Export</button>
        <button className="btn-secondary !min-h-11 text-sm" aria-expanded={mode === 'import'} onClick={() => { setMode(mode === 'import' ? 'idle' : 'import'); setNote(null); }}><Upload size={15} aria-hidden /> Restore</button>
      </div>
      {mode === 'import' && (
        <div className="mt-3">
          <label htmlFor="backup-paste" className="text-xs font-bold text-fg2">Paste a backup below. It replaces everything on this device.</label>
          <textarea id="backup-paste" className="field mt-1.5 font-mono text-xs" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='{"app":"dims-challenge", …}' />
          <button className="btn-primary !min-h-11 text-sm mt-2 w-full" disabled={!text.trim()} onClick={doImport}><ClipboardPaste size={15} aria-hidden /> Restore this backup</button>
        </div>
      )}
      {note && (
        <p role="status" className={`mt-3 text-xs font-semibold flex items-start gap-1.5 ${note.kind === 'ok' ? 'text-accentInk' : 'text-danger'}`}>
          {note.kind === 'ok' ? <Check size={14} className="shrink-0 mt-0.5" aria-hidden /> : <Download size={14} className="shrink-0 mt-0.5 rotate-180" aria-hidden />}{note.msg}
        </p>
      )}
    </div>
  );
}
