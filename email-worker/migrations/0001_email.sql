CREATE TABLE subscriptions (
 id TEXT PRIMARY KEY, room TEXT NOT NULL, uid TEXT NOT NULL, room_epoch REAL NOT NULL,
 email TEXT NOT NULL, confirmed INTEGER NOT NULL DEFAULT 0,
 targets INTEGER NOT NULL, tests INTEGER NOT NULL,
 confirm_hash TEXT, expires INTEGER NOT NULL, unsubscribe_token TEXT NOT NULL,
 created INTEGER NOT NULL, UNIQUE(room,uid)
);
CREATE INDEX subscription_confirm ON subscriptions(confirm_hash);
CREATE UNIQUE INDEX subscription_unsubscribe ON subscriptions(unsubscribe_token);
CREATE TABLE counters (key TEXT PRIMARY KEY, value INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE monitor (room TEXT PRIMARY KEY, epoch REAL, target REAL, rate REAL, observed INTEGER);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE deliveries (key TEXT PRIMARY KEY, created INTEGER NOT NULL, status TEXT NOT NULL);
CREATE TABLE locks (key TEXT PRIMARY KEY, until_ms INTEGER NOT NULL);
CREATE TRIGGER subscription_limit BEFORE INSERT ON subscriptions
WHEN (SELECT COUNT(*) FROM subscriptions)>=10 AND NOT EXISTS(SELECT 1 FROM subscriptions WHERE room=NEW.room AND uid=NEW.uid)
BEGIN SELECT RAISE(ABORT,'Subscription limit reached'); END;
