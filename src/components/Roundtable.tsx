import { useEffect, useRef, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import type { Database } from 'firebase/database';
import type { RoomData, RoomIdentity } from '../lib/rooms';
import { canRaise, castVote, countVotes, manageTie, raiseRound, resolveRound, setRevote } from '../lib/roundtable';
import type { Vote } from '../lib/roundtable';
import { formatRate } from '../lib/rates';

export function Roundtable({ database, code, identity, room }: { database: Database; code: string; identity: RoomIdentity; room: RoomData }) {
  const [target, setTarget] = useState(String(room.sharedTarget));
  const [minutes, setMinutes] = useState('5');
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState(false);
  const [holdDrawn, setHoldDrawn] = useState(false);
  const attempt = useRef('');
  const round = room.roundtable;
  const master = room.masterUid === identity.uid;
  const ballots = round ? room.ballots?.[round.id] ?? {} : {};
  const tally = countVotes(ballots);
  const seconds = round ? Math.max(0, Math.ceil((round.deadline - now) / 1000)) : 0;
  const voteOpen = Boolean(connected && round?.status === 'open' && seconds > 0);
  useEffect(() => onValue(ref(database, '.info/serverTimeOffset'), snapshot => setOffset(Number(snapshot.val()) || 0)), [database]);
  useEffect(() => onValue(ref(database, '.info/connected'), snapshot => { setConnected(snapshot.val() === true); attempt.current = ''; }), [database]);
  useEffect(() => { setNow(Date.now() + offset); const timer = window.setInterval(() => setNow(Date.now() + offset), 1000); return () => clearInterval(timer); }, [offset]);
  useEffect(() => { setHoldDrawn(false); setError(''); setCompose(false); }, [round?.id]);
  useEffect(() => { setTarget(String(room.sharedTarget)); }, [room.sharedTarget]);

  async function action(operation: () => Promise<void>) {
    setBusy(true); setError('');
    try { await operation(); }
    catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Roundtable could not update.';
      setError(/permission.denied/i.test(message) ? 'This round could not be saved. It may have ended, or the updated Firebase rules have not been published.' : message);
    } finally { setBusy(false); }
  }
  useEffect(() => {
    if (!connected || !master || !round) return;
    if (!((round.status === 'open' && seconds === 0) || (round.status === 'accepted' && !round.applied))) return;
    const key = `${round.id}:${round.deadline}:${round.status}`;
    if (attempt.current === key) return;
    attempt.current = key;
    void action(() => resolveRound(database, code, identity.uid, round.id, Date.now() + offset));
  }, [connected, master, round?.id, round?.deadline, round?.status, round?.applied, seconds, database, code, identity.uid, offset]);

  const labels = { open: seconds > 0 ? 'CARDS ON THE TABLE' : 'WAITING FOR ROOM MASTER TO FINALIZE', accepted: round?.applied ? 'FOLLOW WINS · TARGET UPDATED' : 'FOLLOW WINS · SAVING TARGET', rejected: 'FOLD WINS · TARGET UNCHANGED', tie: 'TIE · RAISER CAN EXTEND OR CLOSE', allHold: 'ALL HOLD · WOULD YOU LIKE A RE-VOTE?', closed: 'TABLE CLOSED · TARGET UNCHANGED' };
  // Include departed voters so recorded cards remain visible until the round closes.
  const travelers = { ...Object.fromEntries(Object.entries(ballots).map(([uid, ballot]) => [uid, { ...ballot, online: false }])), ...room.members };
  const holds = Object.keys(travelers).length - tally.follow - tally.fold;
  const finished = round && (round.status === 'rejected' || round.status === 'closed' || (round.status === 'accepted' && round.applied));
  if (finished && !compose) return <button className="news-inline-retry" type="button" onClick={() => setCompose(true)}>PROPOSE NEW TARGET</button>;
  return <section className="roundtable" aria-label="Target roundtable">
    <div className="roundtable-heading"><div><span className="section-kicker">THE CREW DECIDES</span><h3>Target roundtable</h3></div><span className="micro-label">{connected ? 'TABLE CONNECTED' : 'CONNECTING…'}</span></div>
    <p className="roundtable-help">Follow changes the target. Fold keeps it. Hold does not count. Your room master must keep the room open to finalize the result.</p>
    {round && !finished && <>
      <div className="roundtable-proposal"><strong>{formatRate(round.target)} <small>KRW / RM1</small></strong><span>Raised by {round.proposerName}</span><time>{round.status === 'open' ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} remaining` : 'Voting finished'}</time></div>
      <div className="poker-table">
        {Object.entries(travelers).map(([uid, traveler]) => <div className="table-seat" key={uid}><span className="avatar-glyph">{traveler.avatar}</span><strong>{traveler.name}{uid === identity.uid ? ' (you)' : ''}</strong><span className={`played-card vote-${ballots[uid]?.choice ?? 'hold'}`}>{ballots[uid]?.choice?.toUpperCase() ?? (voteOpen ? 'WAITING' : 'HOLD')}</span></div>)}
      </div>
      <p className="roundtable-score">{tally.follow} FOLLOW · {tally.fold} FOLD · {holds} {voteOpen ? 'HOLD / WAITING' : 'HOLD'}</p>
      <p className="roundtable-result" role="status">{labels[round.status]}</p>
      {voteOpen && <div className="vote-hand" role="group" aria-label="Your voting cards">
        {(['follow', 'fold', ...(holdDrawn || ballots[identity.uid]?.choice === 'hold' ? ['hold'] : [])] as Vote[]).map(choice => <button key={choice} className={`vote-card vote-${choice}`} type="button" aria-pressed={ballots[identity.uid]?.choice === choice} disabled={busy} onClick={() => void action(() => castVote(database, code, round.id, identity.uid, { choice, name: identity.name, avatar: identity.avatar }))}><span>{choice === 'follow' ? '♠' : choice === 'fold' ? '♣' : '◇'}</span>{choice.toUpperCase()}<small>{choice === 'follow' ? 'Agree' : choice === 'fold' ? 'Disagree' : 'Abstain'}</small></button>)}
        {!holdDrawn && ballots[identity.uid]?.choice !== 'hold' && <button type="button" className="draw-hold" onClick={() => setHoldDrawn(true)}>DRAW HOLD CARD</button>}
      </div>}
      {round.status === 'allHold' && <div className="revote-prompt"><p>Every traveler can say whether they want another vote.</p>{(['yes', 'no'] as const).map(answer => <button type="button" key={answer} disabled={busy || !connected} aria-pressed={room.revotes?.[round.id]?.[identity.uid] === answer} onClick={() => void action(() => setRevote(database, code, round.id, identity.uid, answer))}>{answer === 'yes' ? 'YES, RE-VOTE' : 'NO THANKS'}</button>)}<p>{Object.values(room.revotes?.[round.id] ?? {}).filter(answer => answer === 'yes').length} want a re-vote. Anyone can raise a fresh round below.</p></div>}
      {round.proposerUid === identity.uid && ['tie', 'allHold'].includes(round.status) && <div className="roundtable-actions"><button type="button" disabled={busy || !connected} onClick={() => void action(() => manageTie(database, code, round.id, identity.uid, 'extend', Date.now() + offset))}>EXTEND BY {round.durationMs / 60_000} MIN</button><button type="button" disabled={busy || !connected} onClick={() => void action(() => manageTie(database, code, round.id, identity.uid, 'close', Date.now() + offset))}>CLOSE TABLE</button></div>}
      {master && ((round.status === 'open' && seconds === 0) || (round.status === 'accepted' && !round.applied)) && <button type="button" disabled={busy || !connected} onClick={() => void action(() => resolveRound(database, code, identity.uid, round.id, Date.now() + offset))}>RETRY FINALIZATION</button>}
    </>}
    {canRaise(round) && <form className="roundtable-form" onSubmit={event => { event.preventDefault(); void action(() => raiseRound(database, code, identity.uid, identity.name, Number(target), Number(minutes), Date.now() + offset)); }}>
      <label>PROPOSED TARGET<input type="number" min="0.001" step="0.001" required value={target} onChange={event => setTarget(event.target.value)} /></label>
      <label>VOTING MINUTES<input type="number" min="0.25" max="1440" step="0.25" required value={minutes} onChange={event => setMinutes(event.target.value)} /></label>
      <button type="submit" disabled={busy || !connected}>RAISE ROUNDTABLE</button>
    </form>}
    {error && <p className="room-error" role="alert">{error}</p>}
  </section>;
}
