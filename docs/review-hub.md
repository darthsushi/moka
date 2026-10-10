# Review Hub

Review Hub is available to active `moderator` and `admin` profiles at `/review-hub`.
The inventory and owner-facing components are unchanged.

## Queues and actions

- **Unassigned**: pending, non-withdrawn placements without a reviewer. A reviewer
  must confirm their assignment before opening the review. Self-review is blocked.
- **Assigned to me**: current user's assignments, including completed decisions.
  Pending reviews must be started; an in-review placement can be approved or
  rejected. Approved placements can be suspended. Suspended reviews can be reopened.
- **Needs reassignment** (admins only): pending/in-review placements whose reviewer
  is no longer eligible. Uncheck the queue filter to transfer work for an absence
  or assign an existing approved placement that predates Review Hub.

A reviewer cannot release or transfer an assignment. Admins can transfer it to an
eligible reviewer, including themselves, with a required reason. Admin status does
not bypass the assignment requirement when recording a decision.

Rejection, suspension and reassignment require a nonblank reason (maximum 2000
characters). Decisions and transfers are appended to the audit log. Actor and
reviewer names are captured at the time of each action. Owner resubmissions and
system requeues also produce status events.

Role removal, non-active profile status and Auth bans make a reviewer ineligible.
This is checked in the database on each request, not from editable JWT metadata.
A reviewer being offline does not automatically change an assignment. Completed
approvals/rejections retain their status and history when a reviewer leaves.
Resubmissions keep the same assignee; if that person is ineligible, they appear in
the admin queue. Withdrawn placements are excluded from all queues.

## Database and compatibility

The migration adds `placement_review_assignments`, `placement_review_events` and
`placements.review_revision`. Private, authorized RPC implementations lock the
placement before changing an assignment or decision. Exposed RPC wrappers use
`SECURITY INVOKER`. Anonymous execution and direct audit/assignment writes are
revoked, and the new tables use RLS. Owners can read only decision/status events
for their placements; internal assignment reasons remain team-only.

`review_revision` changes on every placement update and on face edits. A stale
form cannot submit a decision, preventing an approval based on outdated content.
Existing owner resubmission/withdrawal actions still work. Direct client-side
moderation status updates must now use `review_hub_action` so assignment and audit
checks cannot be bypassed.

Existing approved placements keep their approval and are not assigned an invented
historical reviewer. No owner notification UI is included. The event data is ready
for a future notification panel.

## Verification

`supabase/verification/review_hub.sql` runs against a populated MOKA database as
postgres. It temporarily uses existing profiles and a placement, tests real
`authenticated`/`anon` permissions, and rolls back every test change. It covers
claim exclusivity, direct-write denials, mandatory reasons, resubmission, role
removal, account suspension, admin transfer, stale edits, face edits and withdrawal.

The frontend was checked with ESLint, a production build and a Chromium smoke test
using mocked API responses. The browser checks cover moderator/admin tab access,
claim confirmation, rejection validation, stale-response recovery, transfer,
read-only review by a different assignee, empty-search recovery and mobile layout.
The browser fixtures do not authenticate as a real user or write production data.

Supabase security advisors reported no new findings. Existing unrelated warnings
remain for the exposed `get_profile` definer function and leaked-password protection:
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
