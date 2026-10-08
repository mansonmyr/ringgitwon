import {
  get, onDisconnect, onValue, ref, remove, runTransaction, set,
} from 'firebase/database';
import type { DataSnapshot, Database } from 'firebase/database';

export type RoomMember = {
  name: string;
  avatar: string;
  online: boolean;
  location?: RoomLocation;
  joinedAt?: number;
};

export type RoomLocation = 'nightWatch' | 'commonRoom';

export type RoomAlert = {
  id: string;
  kind: 'test' | 'rate';
  from: string;
  message: string;
  createdAt: number;
  rateDate?: string;
};

export type RoomData = {
  masterUid: string;
  sharedTarget: number;
  createdAt: number;
  members: Record<string, RoomMember>;
  alert?: RoomAlert | null;
};

export type RoomIdentity = { uid: string; name: string; avatar: string };

const ROOM_ROOT = 'rooms';
const AVATARS = ['🕵️', '🧙', '🦊', '🐈', '🦉', '🦝'];

export function avatarFor(index: number): string {
  return AVATARS[index % AVATARS.length];
}

export async function createRoom(database: Database, identity: RoomIdentity, target: number): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const code = String(100000 + (values[0] % 900000));
    const result = await runTransaction(ref(database, `${ROOM_ROOT}/${code}`), (current) => {
      if (current !== null) return;
      return {
        masterUid: identity.uid,
        sharedTarget: target,
        createdAt: Date.now(),
        members: {
          [identity.uid]: {
            name: identity.name,
            avatar: identity.avatar,
            online: true,
            location: 'nightWatch',
            joinedAt: Date.now(),
          },
        },
        alert: null,
      } satisfies RoomData;
    }, { applyLocally: false });
    if (result.committed) return code;
  }
  throw new Error('Could not find an unused room number. Try again.');
}

export async function joinRoom(database: Database, code: string, identity: RoomIdentity): Promise<boolean> {
  const roomRef = ref(database, `${ROOM_ROOT}/${code}`);
  const result = await get(roomRef);
  if (!result.exists()) return false;
  await set(ref(database, `${ROOM_ROOT}/${code}/members/${identity.uid}`), {
    name: identity.name,
    avatar: identity.avatar,
    online: true,
    location: 'nightWatch',
    joinedAt: Date.now(),
  } satisfies RoomMember);
  return true;
}

export function subscribeRoom(
  database: Database,
  code: string,
  uid: string,
  onRoom: (room: RoomData | null) => void,
  onError: (error: Error) => void,
): () => void {
  const roomRef = ref(database, `${ROOM_ROOT}/${code}`);
  const memberPresenceRef = ref(database, `${ROOM_ROOT}/${code}/members/${uid}/online`);
  const stopRoom = onValue(roomRef, (snapshot: DataSnapshot) => {
    onRoom(snapshot.exists() ? snapshot.val() as RoomData : null);
  }, (error) => onError(error));
  const stopConnection = onValue(ref(database, '.info/connected'), async (snapshot) => {
    if (snapshot.val() !== true) return;
    try {
      await onDisconnect(memberPresenceRef).set(false);
      await set(memberPresenceRef, true);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Could not update room presence.'));
    }
  });
  return () => {
    stopRoom();
    stopConnection();
    void set(memberPresenceRef, false);
  };
}

export async function sendTestAlert(database: Database, code: string, name: string, id = crypto.randomUUID()): Promise<string> {
  await set(ref(database, `${ROOM_ROOT}/${code}/alert`), {
    id,
    kind: 'test',
    from: name,
    message: `${name} says: right now!`,
    createdAt: Date.now(),
  } satisfies RoomAlert);
  return id;
}

export async function setRoomLocation(database: Database, code: string, uid: string, location: RoomLocation): Promise<void> {
  await set(ref(database, `${ROOM_ROOT}/${code}/members/${uid}/location`), location);
}

export async function publishRateCrossing(
  database: Database,
  code: string,
  name: string,
  target: number,
  rateDate: string,
  previousRate: number | undefined,
  latestRate: number,
): Promise<void> {
  if (previousRate === undefined || previousRate >= target || latestRate < target) return;
  const alertRef = ref(database, `${ROOM_ROOT}/${code}/alert`);
  await runTransaction(alertRef, (current: RoomAlert | null) => {
    if (current?.rateDate === rateDate) return;
    return {
      id: `rate-${rateDate}`,
      kind: 'rate',
      from: name,
      message: `Target reached: ${latestRate.toFixed(3)} KRW / RM1`,
      createdAt: Date.now(),
      rateDate,
    } satisfies RoomAlert;
  }, { applyLocally: false });
}

export async function updateSharedTarget(database: Database, code: string, target: number): Promise<void> {
  await set(ref(database, `${ROOM_ROOT}/${code}/sharedTarget`), target);
}

export async function dismissRoom(database: Database, code: string): Promise<void> {
  await remove(ref(database, `${ROOM_ROOT}/${code}`));
}
