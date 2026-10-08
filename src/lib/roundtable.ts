import { get, ref, runTransaction, set, update } from 'firebase/database';
import type { Database } from 'firebase/database';

export type Vote = 'follow' | 'fold' | 'hold';
export type RoundStatus = 'open' | 'accepted' | 'rejected' | 'tie' | 'allHold' | 'closed';
export type Round = {
  id: string;
  proposerUid: string;
  proposerName: string;
  target: number;
  durationMs: number;
  deadline: number;
  status: RoundStatus;
  applied: boolean;
  follow: number;
  fold: number;
};
export type Ballot = { choice: Vote; name: string; avatar: string };
export type RoundRoom = {
  masterUid: string;
  members: Record<string, { name: string; avatar: string; online: boolean }>;
  roundtable?: Round;
  ballots?: Record<string, Record<string, Ballot>>;
  revotes?: Record<string, Record<string, 'yes' | 'no'>>;
};
const roundPath = (code: string) => `rooms/${code}/roundtable`;

export function countVotes(ballots: Record<string, Ballot> = {}) {
  return Object.values(ballots).reduce((count, ballot) => {
    if (ballot.choice === 'follow') count.follow++;
    if (ballot.choice === 'fold') count.fold++;
    return count;
  }, { follow: 0, fold: 0 });
}
export function voteOutcome(follow: number, fold: number): RoundStatus {
  return follow > fold ? 'accepted' : fold > follow ? 'rejected' : follow === 0 ? 'allHold' : 'tie';
}
export function canRaise(round?: Round | null) {
  return !round || round.status === 'closed' || round.status === 'rejected' || round.status === 'allHold' || (round.status === 'accepted' && round.applied);
}

export async function raiseRound(database: Database, code: string, uid: string, name: string, target: number, minutes: number, now: number) {
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(minutes) || minutes < 0.25 || minutes > 1440) throw new Error('Choose a positive target and a duration between 15 seconds and 24 hours.');
  const proposal: Round = { id: crypto.randomUUID(), proposerUid: uid, proposerName: name, target, durationMs: Math.round(minutes * 60_000), deadline: now + Math.round(minutes * 60_000), status: 'open', applied: false, follow: 0, fold: 0 };
  const result = await runTransaction(ref(database, roundPath(code)), (current: Round | null) => canRaise(current) ? proposal : undefined, { applyLocally: false });
  if (!result.committed) throw new Error('Another roundtable is already active.');
}

export async function castVote(database: Database, code: string, roundId: string, uid: string, ballot: Ballot) {
  await set(ref(database, `rooms/${code}/ballots/${roundId}/${uid}`), ballot);
}

// Ballots are frozen by server rules at the deadline. Only the existing room
// master can finalize and apply the outcome; no member can write others' cards.
export async function resolveRound(database: Database, code: string, uid: string, expectedId: string, now: number) {
  const snapshot = await get(ref(database, `rooms/${code}`));
  const room = snapshot.val() as RoundRoom | null;
  const round = room?.roundtable;
  if (!room || room.masterUid !== uid || !round || round.id !== expectedId) return;
  if (round.status === 'open' && round.deadline <= now) {
    const tally = countVotes(room.ballots?.[round.id]);
    await runTransaction(ref(database, roundPath(code)), (current: Round | null) => {
      if (!current || current.id !== round.id || current.status !== 'open' || current.deadline !== round.deadline) return;
      return { ...current, ...tally, status: voteOutcome(tally.follow, tally.fold) } satisfies Round;
    }, { applyLocally: false });
  }
  const latest = (await get(ref(database, roundPath(code)))).val() as Round | null;
  if (latest?.id === expectedId && latest.status === 'accepted' && !latest.applied) {
    // Atomic update: a new round cannot start until both values are saved.
    try {
      await update(ref(database, `rooms/${code}`), { sharedTarget: latest.target, 'roundtable/applied': true });
    } catch (error) {
      // Another master tab may have completed the same atomic update first.
      const saved = (await get(ref(database, roundPath(code)))).val() as Round | null;
      if (saved?.id !== expectedId || !saved.applied) throw error;
    }
  }
}

export async function manageTie(database: Database, code: string, roundId: string, uid: string, action: 'extend' | 'close', now: number) {
  const result = await runTransaction(ref(database, roundPath(code)), (current: Round | null) => {
    if (!current || current.id !== roundId || current.proposerUid !== uid || !['tie', 'allHold'].includes(current.status)) return;
    return { ...current, status: action === 'extend' ? 'open' : 'closed', deadline: action === 'extend' ? now + current.durationMs : current.deadline } satisfies Round;
  }, { applyLocally: false });
  if (!result.committed) throw new Error('This round has already changed.');
}
export async function setRevote(database: Database, code: string, roundId: string, uid: string, answer: 'yes' | 'no') {
  await set(ref(database, `rooms/${code}/revotes/${roundId}/${uid}`), answer);
}
