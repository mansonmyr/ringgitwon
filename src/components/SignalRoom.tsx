import { useEffect, useRef, useState } from 'react';
import type { Database } from 'firebase/database';
import { connectFirebaseMember, firebaseConfigured } from '../lib/firebase';
import {
  avatarFor, createRoom, dismissRoom, joinRoom, publishRateCrossing, sendTestAlert, subscribeRoom,
} from '../lib/rooms';
import type { RoomData, RoomIdentity } from '../lib/rooms';
import { formatRate } from '../lib/rates';
import { Roundtable } from './Roundtable';

const AVATARS = ['🕵️', '🧙', '🦊', '🐈', '🦉', '🦝'];

function defaultName(): string {
  try { return localStorage.getItem('ringgit-heist-room-name') || ''; }
  catch { return ''; }
}

type RoomRate = { rate: number; date: string; previousRate?: number; fresh: boolean; source: string; timeLabel: string };

export function SignalRoom({ rate: latest }: { rate: RoomRate | null }) {
  const [name, setName] = useState(defaultName);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [targetInput, setTargetInput] = useState('350');
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [member, setMember] = useState<RoomIdentity | null>(null);
  const [database, setDatabase] = useState<Database | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [repeatPings, setRepeatPings] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    () => typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [notificationMessage, setNotificationMessage] = useState('');
  const seenAlert = useRef<string | null>(null);
  const seenRound = useRef<string | null>(null);
  const alreadyPlayedAlert = useRef<string | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!database || !member || !roomCode) return;
    setError('');
    return subscribeRoom(database, roomCode, member.uid, (nextRoom) => {
      setRoom(nextRoom);
      if (!nextRoom) setError('This room is no longer available.');
      if (nextRoom) setTargetInput(String(nextRoom.sharedTarget));
    }, (nextError) => setError(nextError.message));
  }, [database, member, roomCode]);

  useEffect(() => {
    const alert = room?.alert;
    if (seenAlert.current === null) {
      seenAlert.current = alert?.id ?? '';
      return;
    }
    if (alert && seenAlert.current !== alert.id) {
      seenAlert.current = alert.id;
      if ('vibrate' in navigator) navigator.vibrate([120, 70, 120]);
      if (alreadyPlayedAlert.current !== alert.id) playAlertSound();
      alreadyPlayedAlert.current = null;
      if (notificationPermission === 'granted') {
        try {
          new Notification('Signal Room · right now!', {
            body: alert.message,
            tag: alert.id,
            icon: '/ringgit-cursor.svg',
          });
        } catch { /* The in-page alert and sound remain available if the browser blocks notifications. */ }
      }
    }
  }, [notificationPermission, room?.alert?.id]);

  useEffect(() => {
    if (!room) return;
    const proposal = room.roundtable;
    if (seenRound.current === null) { seenRound.current = proposal?.id ?? ''; return; }
    if (!proposal || seenRound.current === proposal.id) return;
    seenRound.current = proposal.id;
    playAlertSound();
    if (notificationPermission === 'granted') {
      try {
        new Notification('Signal Room · roundtable called', {
          body: `${proposal.proposerName} proposes ${formatRate(proposal.target)} KRW / RM1. Play your card.`,
          tag: proposal.id,
        });
      } catch { /* The roundtable remains visible in the room. */ }
    }
  }, [room?.roundtable?.id, Boolean(room), notificationPermission]);

  useEffect(() => {
    if (!database || !member || !roomCode || !room || !latest?.fresh) return;
    void publishRateCrossing(database, roomCode, member.name, room.sharedTarget, latest.date, latest.previousRate, latest.rate)
      .catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : 'Could not publish the rate alert.'));
  }, [database, latest?.date, latest?.rate, latest?.fresh, latest?.previousRate, member, room?.sharedTarget, roomCode]);

  useEffect(() => {
    if (room?.alert?.kind !== 'rate' || !latest?.fresh || latest.rate < room.sharedTarget) return;
    const timer = window.setInterval(() => {
      setRepeatPings((count) => count + 1);
      if ('vibrate' in navigator) navigator.vibrate([120, 70, 120]);
    }, 90 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [latest?.rate, latest?.fresh, room?.alert?.id, room?.alert?.kind, room?.sharedTarget]);

  async function enterRoom(action: 'create' | 'join') {
    const trimmedName = name.trim().slice(0, 20);
    if (!trimmedName) { setError('Choose a traveler name first.'); return; }
    if (action === 'create' && (!Number.isFinite(Number(targetInput)) || Number(targetInput) <= 0)) {
      setError('Enter a target rate greater than zero.');
      return;
    }
    if (action === 'join' && !/^\d{6}$/.test(joinCode)) { setError('Enter the six-digit room number.'); return; }

    setBusy(true);
    setError('');
    try {
      const connection = await connectFirebaseMember();
      const identity = { uid: connection.uid, name: trimmedName, avatar: AVATARS[avatarIndex] };
      try { localStorage.setItem('ringgit-heist-room-name', trimmedName); } catch { /* Name is still available during this visit. */ }
      if (action === 'create') {
        const code = await createRoom(connection.database, identity, Number(targetInput));
        setDatabase(connection.database);
        setMember(identity);
        setRoomCode(code);
        setRoom(null);
      } else {
        const found = await joinRoom(connection.database, joinCode, identity);
        if (!found) {
          setError('No room found. Do you want to create a new room?');
          return;
        }
        setDatabase(connection.database);
        setMember(identity);
        setRoomCode(joinCode);
        setRoom(null);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Signal Room could not connect. Check Firebase setup and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function testAlert() {
    if (!database || !member) return;
    setBusy(true);
    setError('');
    const alertId = crypto.randomUUID();
    alreadyPlayedAlert.current = alertId;
    playAlertSound();
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        setNotificationPermission(await Notification.requestPermission());
      }
      await sendTestAlert(database, roomCode, member.name, alertId);
    }
    catch (nextError) {
      alreadyPlayedAlert.current = null;
      setError(nextError instanceof Error ? nextError.message : 'Test Alert could not be sent.');
    }
    finally { setBusy(false); }
  }

  async function enableBrowserAlerts() {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      setNotificationMessage('This browser does not support desktop notifications.');
      return;
    }
    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      setNotificationMessage('Notifications are blocked in this browser. Allow them in site settings to receive browser alerts.');
      return;
    }
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setNotificationPermission(permission);
    setNotificationMessage(permission === 'granted'
      ? 'Browser alerts are enabled for this device while RinggitWon is open.'
      : 'Allow notifications in the browser prompt to receive browser alerts.');
  }

  function playAlertSound() {
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return;
      const context = audioContext.current ?? new AudioContextConstructor();
      audioContext.current = context;
      if (context.state === 'suspended') void context.resume();
      const start = context.currentTime;
      [740, 988].forEach((frequency, index) => {
        const at = start + index * 0.18;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.17);
      });
    } catch { /* Audio is best-effort; the visual alert still works. */ }
  }

  function leaveRoom() {
    setRoomCode('');
    setRoom(null);
    setMember(null);
    setDatabase(null);
    setRepeatPings(0);
    seenAlert.current = null;
    seenRound.current = null;
    setError('');
  }

  async function dismissCurrentRoom() {
    if (!database || !room || !isMaster || busy) return;
    const confirmed = window.confirm(`Dismiss room ${roomCode}? This permanently deletes the room, its travelers, alerts, and shared target from Firebase for everyone.`);
    if (!confirmed) return;
    setBusy(true);
    setError('');
    try {
      await dismissRoom(database, roomCode);
      leaveRoom();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not dismiss this room.');
    } finally {
      setBusy(false);
    }
  }

  const isMaster = Boolean(member && room?.masterUid === member.uid);
  const members = Object.entries(room?.members ?? {});


  return (
    <section className="signal-room-panel" id="signal-room" aria-label="Signal Room">
      <div className="room-heading">
        <div><span className="section-kicker">03 / HEIST TOGETHER</span><h2>Signal Room</h2><p>Bring your travel crew into one shared rate watch.</p></div>
        <span className={`freshness ${room ? '' : 'is-stale'}`}><i />{room ? 'ROOM CONNECTED' : firebaseConfigured ? 'READY TO CONNECT' : 'SETUP NEEDED'}</span>
      </div>

      {!roomCode ? <div className="room-lobby">
        {!firebaseConfigured && <div className="room-setup" role="status">
          <strong>Connect the free Firebase room service</strong>
          <p>Add the web app settings to <code>.env.local</code>, enable Anonymous Authentication and Realtime Database, apply <code>database.rules.json</code>, then restart Vite.</p>
        </div>}
        <div className="room-profile">
          <label>TRAVELER NAME<input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} placeholder="e.g. Kai" autoComplete="nickname" /></label>
          <div className="avatar-picker" role="group" aria-label="Choose your room avatar">
            {AVATARS.map((avatar, index) => <button className={avatarIndex === index ? 'is-selected' : ''} key={avatar} type="button" aria-label={`Choose avatar ${index + 1}`} aria-pressed={avatarIndex === index} onClick={() => setAvatarIndex(index)}><span className="avatar-glyph">{avatar}</span></button>)}
          </div>
        </div>
        <div className="room-entry-grid">
          <form className="room-entry-card" onSubmit={(event) => { event.preventDefault(); void enterRoom('create'); }}>
            <span className="micro-label">START A CREW</span><h3>Create a room</h3>
            <label>SHARED TARGET · KRW / RM1<input inputMode="decimal" type="number" min="0.001" step="0.001" value={targetInput} onChange={(event) => setTargetInput(event.target.value)} /></label>
            <button type="submit" disabled={!firebaseConfigured || busy}>{busy ? 'CONNECTING…' : 'CREATE SIX-DIGIT ROOM'}</button>
          </form>
          <form className="room-entry-card" onSubmit={(event) => { event.preventDefault(); void enterRoom('join'); }}>
            <span className="micro-label">JOIN YOUR CREW</span><h3>Enter a room number</h3>
            <label>SIX-DIGIT ROOM NUMBER<input inputMode="numeric" type="text" pattern="[0-9]{6}" maxLength={6} value={joinCode} onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" /></label>
            <button type="submit" disabled={!firebaseConfigured || busy}>{busy ? 'CONNECTING…' : 'JOIN ROOM'}</button>
          </form>
        </div>
        {error && <div className="room-error" role="alert"><span>{error}</span>{error.startsWith('No room found') && <button type="button" onClick={() => void enterRoom('create')} disabled={!firebaseConfigured || busy}>CREATE A NEW ROOM</button>}</div>}
      </div> : <div className="room-live">
        <div className="room-live-top"><div><span className="micro-label">ROOM NUMBER</span><strong className="room-code">{roomCode}</strong><span className="room-role">{isMaster ? 'ROOM MASTER' : 'CREW MEMBER'}</span></div><div className="room-live-actions">{isMaster && <button type="button" className="room-dismiss" onClick={() => void dismissCurrentRoom()} disabled={busy}>DISMISS ROOM</button>}<button type="button" className="room-leave" onClick={leaveRoom}>LEAVE ROOM</button></div></div>
        {room ? <>
          <div className="room-shared-rate"><div><span className="micro-label">SHARED TARGET</span><strong>{formatRate(room.sharedTarget)} <small>KRW / RM1</small></strong></div><div><span className="micro-label">LATEST RATE</span><strong>{latest ? formatRate(latest.rate) : '—'} <small>KRW / RM1</small></strong></div></div>
          <p className="chart-caption">{latest ? <>{latest.source === 'Twelve Data' ? <a href="https://twelvedata.com" target="_blank" rel="noopener noreferrer">Twelve Data</a> : latest.source} · {latest.timeLabel}</> : 'Waiting for a verified rate source.'} {!latest?.fresh && 'Automatic rate alerts paused.'}</p>
          <div className="room-scene">
            <div className="room-travelers">{members.map(([uid, traveler], index) => <div className={`room-traveler traveler-${index % 6}`} key={uid} title={`${traveler.name}${traveler.online ? ' · online' : ' · away'}`}>
              <span className="traveler-avatar"><span className="avatar-glyph">{traveler.avatar || avatarFor(index)}</span></span><span className="traveler-name">{traveler.name}</span><i className={traveler.online ? 'online' : ''} />
            </div>)}</div>
            <span className="scene-caption">{members.filter(([, traveler]) => traveler.online).length} TRAVELER{members.filter(([, traveler]) => traveler.online).length === 1 ? '' : 'S'} CONNECTED</span>
          </div>
          <div className="room-controls">
            <p>Propose a shared target change at the roundtable below.</p>
            <button type="button" className="test-alert-button" onClick={() => void testAlert()} disabled={busy}>⚡ TEST ALERT · BUZZ THE ROOM</button>
            <button type="button" className="room-notification-button" onClick={() => void enableBrowserAlerts()}>{notificationPermission === 'granted' ? 'BROWSER ALERTS ON' : 'ENABLE BROWSER ALERTS'}</button>
          </div>
          {notificationMessage && <p className="room-notification-message" role="status">{notificationMessage}</p>}
          {room.alert && <div className="party-alert" role="status" key={room.alert.id}><span className="alert-signal">PING</span><div><strong>{room.alert.message}</strong><small>{room.alert.kind === 'test' ? 'TEST ALERT' : `RATE REACHED · ${room.alert.rateDate ?? ''}`}</small></div></div>}
          {repeatPings > 0 && <p className="repeat-ping">PING {repeatPings + 1} · Rate remains above the shared target.</p>}
          {database && member && <Roundtable database={database} code={roomCode} identity={member} room={room} />}
        </> : <div className="room-wait">CONNECTING TO ROOM SIGNAL…</div>}
        {error && <div className="room-error" role="alert">{error}</div>}
      </div>}
    </section>
  );
}
