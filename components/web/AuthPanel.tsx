'use client';

import type { Session } from '@supabase/supabase-js';
import { FormEvent, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export function AuthPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured || !supabase) return null;
  const client = supabase;

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      setMessage(error ? error.message : 'ログイン用リンクをメールで送りました');
    } catch {
      setMessage('ログインメールを送信できませんでした。しばらくしてから再試行してください。');
    } finally {
      setBusy(false);
    }
  }

  if (session?.user) {
    return (
      <aside className="auth-panel" aria-label="アカウント">
        <span className="auth-message">{session.user.email}</span>
        <button type="button" onClick={() => client.auth.signOut()}>ログアウト</button>
      </aside>
    );
  }

  return (
    <form className="auth-panel" onSubmit={signIn}>
      <input
        aria-label="メールアドレス"
        autoComplete="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="メールアドレス"
        type="email"
        value={email}
      />
      <button disabled={busy} type="submit">{busy ? '送信中…' : 'ログイン'}</button>
      {message ? <span className="auth-message" role="status">{message}</span> : null}
    </form>
  );
}
