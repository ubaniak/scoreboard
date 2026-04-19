# Pre-Launch Test Checklist

## Setup & Auth
- [ ] App starts and opens in browser
- [ ] Admin login works
- [ ] Judge login works (generate device code, log in as judge1–judge5)
- [ ] Unauthorized routes are blocked (judges can't access admin pages)

## Officials (recently migrated to global)
- [ ] Officials list appears under Home → Officials (not inside a card)
- [ ] Can add, edit, delete an official
- [ ] Can import officials via CSV
- [ ] Officials appear in the referee selector when creating/editing a bout
- [ ] Officials appear on the judge name picker screen
- [ ] Old officials from the DB still appear (migration didn't wipe existing data)

## Cards
- [ ] Can create, edit, delete a card
- [ ] Can start and end a card
- [ ] Card image upload and removal works

## Bouts
- [ ] Can create, edit, delete a bout
- [ ] Can import bouts via CSV
- [ ] Bout shows correct red/blue corner names
- [ ] Referee can be assigned before starting a bout
- [ ] Can start a bout

## Rounds
- [ ] Round starts, timer counts down
- [ ] Fouls/warnings can be recorded for red and blue
- [ ] Eight counts can be recorded
- [ ] Round progresses through states: not started → in progress → waiting for results → complete
- [ ] Can advance to next round manually
- [ ] Round 3 is the final round

## Judge Scoring Flow
- [ ] Judge sees idle screen when no bout is active
- [ ] Judge sees name picker at start of bout; can select their name
- [ ] Judge sees waiting screen while round is not ready for scoring
- [ ] Judge can score a round (all criteria)
- [ ] Judge sees submitted/waiting screen after submitting
- [ ] After submitting round 3, judge immediately sees the **overall winner picker** (Red/Blue buttons)
- [ ] After picking overall winner, judge sees **"Scores Submitted"** screen
- [ ] If a new bout starts, judge state resets (no leftover "overall winner selected" from previous bout)
- [ ] "Change name" link works on waiting screen

## Admin Scores Table
- [ ] Scores table shows judges across the top, rounds as rows
- [ ] Judge number, name, and status badge appear above Red/Blue sub-columns
- [ ] Status badge updates live (not started → ready → complete)
- [ ] Deductions row shows total warnings per judge
- [ ] Total row subtracts deductions correctly
- [ ] Overall winner row appears only in admin view, shows each judge's pick with a ✓

## Public Scoreboard
- [ ] Scoreboard shows current bout and round info
- [ ] Scores update in real time via SSE
- [ ] Deductions row appears when warnings exist
- [ ] Total row reflects deductions
- [ ] Athlete photos/club names display if set

## End of Bout (Admin)
- [ ] Can make a decision (winner + method)
- [ ] "Show Decision on Scoreboard" button works
- [ ] Decision appears on the public scoreboard
- [ ] "End Bout" closes the bout and advances to next

## Clubs & Athletes
- [ ] Can add, edit, delete clubs and athletes
- [ ] Can import via CSV
- [ ] Athlete linked to club shows club name
- [ ] Club/athlete images upload and display correctly

## Devices
- [ ] Judge device list shows connected judges
- [ ] Generate/refresh device code works
- [ ] Health check ping keeps judge session alive

## Multi-device / Real-time
- [ ] Two browsers open simultaneously (admin + judge) stay in sync via SSE
- [ ] Scoring on judge device reflects in admin view without refresh
- [ ] Public scoreboard updates without refresh

## Edge Cases
- [ ] App works correctly when no bouts exist on a card
- [ ] Scoreboard shows idle state when no card/bout is active
- [ ] Sparring bouts don't require a referee
- [ ] Judge page handles loss of connection gracefully (SSE reconnect)
