import { useEffect, useState } from 'react';
import { emailAlertsConfigured, emailRequest } from '../lib/emailAlerts';
import type { EmailStatus } from '../lib/emailAlerts';

export function EmailAlerts({ room }: { room: string }) {
  const [email, setEmail] = useState('');
  const [targets, setTargets] = useState(true);
  const [tests, setTests] = useState(false);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<EmailStatus>({ status: 'off' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!emailAlertsConfigured) return;
    let active = true;
    void emailRequest<EmailStatus>('status', room).then(s => { if (active) setStatus(s); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Email status unavailable.'); });
    return () => { active = false; };
  }, [room]);
  async function action(kind: 'subscribe' | 'disable' | 'status') {
    setBusy(true); setError(''); setMessage('');
    try {
      if (kind === 'status') setStatus(await emailRequest<EmailStatus>('status', room));
      else {
        const result = await emailRequest<{ message: string }>(kind, room, kind === 'subscribe' ? { email, targets, tests, consent } : {});
        setMessage(result.message);
        setStatus(await emailRequest<EmailStatus>('status', room));
        if (kind === 'disable') { setEmail(''); setConsent(false); }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Email request failed.'); }
    finally { setBusy(false); }
  }
  return <section className="email-alerts" aria-label="Signal Room email notifications">
    <h3>Email notifications</h3>
    <p>Get an email when a scheduled check first finds your shared target crossed. Once connected, checks run every 30 minutes, even when this page is closed.</p>
    {!emailAlertsConfigured ? <p className="stale-note">Email delivery is not connected yet. No emails will be sent until setup is complete.</p> : <>
      <p role="status">{status.status === 'verified' ? `EMAIL VERIFIED · ${status.email}` : status.status === 'pending' ? `AWAITING VERIFICATION · ${status.email}` : status.status === 'expired' ? 'VERIFICATION EXPIRED · request a new email' : 'EMAIL ALERTS OFF'}</p>
      <form onSubmit={event => { event.preventDefault(); void action('subscribe'); }}>
        <label>Email address<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label className="email-choice"><input type="checkbox" checked={targets} onChange={event => setTargets(event.target.checked)} />Target reached</label>
        <label className="email-choice"><input type="checkbox" checked={tests} onChange={event => setTests(event.target.checked)} />Room test alerts</label>
        <label className="email-choice"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} />I agree to these room emails until I unsubscribe, including after I leave or close this page.</label>
        <button type="submit" disabled={busy || (!targets && !tests)}>{busy ? 'PLEASE WAIT' : 'SEND VERIFICATION EMAIL'}</button>
      </form>
      <div className="room-controls">
        <button type="button" disabled={busy} onClick={() => void action('status')}>CHECK STATUS</button>
        {status.status !== 'off' && <button type="button" disabled={busy} onClick={() => void action('disable')}>STOP EMAILS</button>}
      </div>
      <p className="chart-caption">Confirm the link in your inbox before alerts start. Changing your email or choices requires verification again. Email addresses are kept private from other travelers. Each email includes an unsubscribe link. Dismissed rooms stop on the next scheduled check. Checks can miss short-lived price changes.</p>
    </>}
    {message && <p role="status">{message}</p>}{error && <p className="room-error" role="alert">{error}</p>}
  </section>;
}
