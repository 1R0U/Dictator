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
    let active = true;
    let receivedAuthEvent = false;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedAuthEvent) return;
      if (error) {
        setMessage('ログイン状態を確認できませんでした。ページを再読み込みしてください。');
        return;
      }
      setSession(data.session);
    }).catch(() => {
      if (active && !receivedAuthEvent) {
        setMessage('ログイン状態を確認できませんでした。ページを再読み込みしてください。');
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      receivedAuthEvent = true;
      setSession(nextSession);
      setMessage('');
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured || !supabase) {
    return <aside className="auth-panel" role="status">現在はサンプル文章で遊べます。AI生成は利用できません。</aside>;
  }
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

  async function signOut() {
    setBusy(true);
    setMessage('');
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch {
      setMessage('ログアウトできませんでした。もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  if (session?.user) {
    return (
      <aside className="auth-panel" aria-label="アカウント">
        <span className="auth-message">{session.user.email}</span>
        <button disabled={busy} type="button" onClick={signOut}>ログアウト</button>
        {message ? <span className="auth-message" role="status">{message}</span> : null}
      </aside>
    );
  }

  return (
    <form className="auth-panel" onSubmit={signIn}>
      <span className="auth-message">AIが物語を生成するにはログインが必要です。未ログインではサンプル文章で進行します。</span>
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
