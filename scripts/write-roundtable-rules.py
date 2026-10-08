"""Generate explicit Realtime Database rules for the client-coordinated demo.
The existing room master remains the trusted authority for tally/finalization.
"""
import json
from pathlib import Path
path = Path('database.rules.json')
rules = json.loads(path.read_text())
room = rules['rules']['rooms']['$roomCode']
R = "root.child('rooms').child($roomCode)"
member = f"auth != null && {R}.child('members').child(auth.uid).exists()"
master = f"auth != null && {R}.child('masterUid').val() === auth.uid"
def old(key): return f"data.child('{key}').val()"
def new(key): return f"newData.child('{key}').val()"
def unchanged(*keys): return ' && '.join(f'{new(k)} === {old(k)}' for k in keys)
terminal = f"(!data.exists() || {old('status')} === 'closed' || {old('status')} === 'rejected' || {old('status')} === 'allHold' || ({old('status')} === 'accepted' && {old('applied')} === true))"
new_deadline = f"{new('deadline')} > now && {new('deadline')} <= now + {new('durationMs')} + 10000"
creation = f"({terminal} && {new('id')} !== {old('id')} && !{R}.child('ballots').child({new('id')}).exists() && !{R}.child('revotes').child({new('id')}).exists() && {new('proposerUid')} === auth.uid && {new('proposerName')} === {R}.child('members').child(auth.uid).child('name').val() && {new('status')} === 'open' && {new('applied')} === false && {new('follow')} === 0 && {new('fold')} === 0 && {new_deadline})"
finished_status = f"(({new('follow')} > {new('fold')} && {new('status')} === 'accepted') || ({new('fold')} > {new('follow')} && {new('status')} === 'rejected') || ({new('follow')} === {new('fold')} && (({new('follow')} === 0 && {new('status')} === 'allHold') || ({new('follow')} > 0 && {new('status')} === 'tie'))))"
finish = f"({master} && {old('status')} === 'open' && now >= {old('deadline')} && {new('deadline')} === {old('deadline')} && {new('applied')} === false && {finished_status})"
manage = f"({old('proposerUid')} === auth.uid && ({old('status')} === 'tie' || {old('status')} === 'allHold') && {unchanged('follow','fold','applied')} && (({new('status')} === 'open' && {new_deadline}) || ({new('status')} === 'closed' && {new('deadline')} === {old('deadline')})))"
apply = f"({master} && {old('status')} === 'accepted' && {old('applied')} === false && {new('applied')} === true && {unchanged('status','deadline','follow','fold')} && newData.parent().child('sharedTarget').val() === {new('target')})"
room['.validate'] = "newData.hasChildren(['masterUid','sharedTarget','createdAt','members']) && (data.exists() || (!newData.child('roundtable').exists() && !newData.child('ballots').exists() && !newData.child('revotes').exists()))"
room['masterUid'] = {'.validate': "newData.isString() && (!data.exists() || newData.val() === data.val())"}
room['createdAt'] = {'.validate': "newData.isNumber() && (!data.exists() || newData.val() === data.val())"}
room['sharedTarget']['.write'] = f"{master} && {R}.child('roundtable/status').val() === 'accepted' && {R}.child('roundtable/applied').val() === false && newData.val() === {R}.child('roundtable/target').val() && newData.parent().child('roundtable/applied').val() === true"
room['roundtable'] = {
 '.write': f"{member} && newData.exists() && ({creation} || ({unchanged('id','proposerUid','proposerName','target','durationMs')} && ({finish} || {manage} || {apply})))",
 '.validate': "newData.hasChildren(['id','proposerUid','proposerName','target','durationMs','deadline','status','applied','follow','fold'])",
 'id': {'.validate': "newData.isString() && newData.val().matches(/^[a-zA-Z0-9-]{36}$/)"},
 'proposerUid': {'.validate': 'newData.isString()'},
 'proposerName': {'.validate': 'newData.isString() && newData.val().length <= 20'},
 'target': {'.validate': 'newData.isNumber() && newData.val() > 0'},
 'durationMs': {'.validate': 'newData.isNumber() && newData.val() >= 15000 && newData.val() <= 86400000'},
 'deadline': {'.validate': 'newData.isNumber()'},
 'status': {'.validate': "newData.val() === 'open' || newData.val() === 'accepted' || newData.val() === 'rejected' || newData.val() === 'tie' || newData.val() === 'allHold' || newData.val() === 'closed'"},
 'applied': {'.validate': 'newData.isBoolean()'},
 'follow': {'.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() % 1 === 0'},
 'fold': {'.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() % 1 === 0'},
 '$other': {'.validate': False}
}
room['ballots'] = {'$roundId': {'$uid': {
 '.write': f"{member} && auth.uid === $uid && newData.exists() && {R}.child('roundtable/id').val() === $roundId && {R}.child('roundtable/status').val() === 'open' && now < {R}.child('roundtable/deadline').val()",
 '.validate': "newData.hasChildren(['choice','name','avatar'])",
 'choice': {'.validate': "newData.val() === 'follow' || newData.val() === 'fold' || newData.val() === 'hold'"},
 'name': {'.validate': f"newData.val() === {R}.child('members').child($uid).child('name').val()"},
 'avatar': {'.validate': f"newData.val() === {R}.child('members').child($uid).child('avatar').val()"},
 '$other': {'.validate': False}
}}}
room['revotes'] = {'$roundId': {'$uid': {
 '.write': f"{member} && auth.uid === $uid && newData.exists() && {R}.child('roundtable/id').val() === $roundId && {R}.child('roundtable/status').val() === 'allHold'",
 '.validate': "newData.val() === 'yes' || newData.val() === 'no'"
}}}
path.write_text(json.dumps(rules, indent=2) + '\n')
