# Beta Readiness

This checklist is for preparing the D&D Encounter Builder for GitHub and Vercel
beta deployment. It is intentionally conservative.

## Security Checklist

- [x] Supabase Auth foundation exists for sign-up, sign-in, and sign-out.
- [x] Client code uses only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [x] No service role key is used in browser/client code.
- [x] `.env.local` and other env files are ignored by Git.
- [x] `.env.example` contains placeholders only, not secrets.
- [x] Profiles table migration exists.
- [x] RLS policies exist for user-owned root tables and encounter child tables.
- [x] RLS validation is documented in `docs/rls-validation.md`.
- [ ] Run the RLS smoke test against local Supabase before inviting beta users.
- [ ] Configure Supabase Auth redirect URLs for `http://localhost:3000` and the
  final Vercel URLs.

## Data Persistence Status

| Area | Status |
| --- | --- |
| Saved Encounters dashboard | Signed-in metadata persistence started, including campaign management and encounter metadata editing. |
| Creature Library | Signed-in `creature_templates` persistence started. |
| Importer paste saves | Reviewed pasted imports save to signed-in Library. |
| Builder | Still not fully save/load wired to Supabase. |
| Runner | First-pass live-state persistence started. |
| SRD import | Hidden by default; still experimental behind feature flag. |
| Local demo fallback | Preserved when Supabase env vars are missing or demo flag is true. |

## Demo/Sample Data Gate

Production/beta should use:

```text
NEXT_PUBLIC_USE_DEMO_DATA=false
```

When Supabase env vars are configured and demo mode is false, signed-in users
should not automatically receive premade sample encounters or creatures. Local
sample data remains available for development when Supabase env vars are missing
or when demo mode is explicitly enabled.

## SRD Import Gate

Production/beta should use:

```text
NEXT_PUBLIC_ENABLE_SRD_IMPORT=false
```

The Tabyltop CC-SRD importer code and docs remain in the repo, but the visible
Importer UI should show only paste stat block import and import history unless
the feature flag is turned on locally.

## UI Smoke Checklist

- [ ] Auth screen renders when Supabase env vars exist and the user is signed
  out.
- [ ] Local demo mode renders when Supabase env vars are missing.
- [ ] Saved Encounters dashboard renders.
- [ ] Campaigns can be created, renamed, archived, and used as dashboard filters.
- [ ] Encounter name and metadata can be edited from the dashboard.
- [ ] Builder renders.
- [ ] Runner renders.
- [ ] Creature Library renders.
- [ ] Importer renders.
- [ ] Paste stat block parser/review/save works.
- [ ] Empty states work for signed-in users with no saved data.

## Deployment Checklist

- [ ] GitHub repo created.
- [ ] No `.env.local` or secret files staged.
- [ ] Vercel project connected to GitHub.
- [ ] Vercel env vars added:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_USE_DEMO_DATA=false`
  - `NEXT_PUBLIC_ENABLE_SRD_IMPORT=false`
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Supabase Auth redirect URLs include local and Vercel URLs.
- [ ] RLS two-user smoke test passes.
- [ ] Beta smoke test completed with a fresh test account.

## Known Limitations

- Builder save/load is still in progress.
- Builder header campaign/name editing is still local/prototype-oriented; the
  dashboard edit form is the current reliable metadata editor.
- Runner persistence is first-pass and action-based.
- Runner add/remove combatant persistence is not complete.
- Spell effects persist in combatant snapshot metadata until a dedicated schema
  field is added.
- SRD import UI is hidden until validation is stable.
- No payments, subscriptions, or donations are implemented.
- No official copyrighted non-SRD D&D monster data is bundled.
- Beta users should use their own/imported content.

## References

- `docs/auth-beta-plan.md`
- `docs/rls-validation.md`
- `docs/vercel-supabase-beta-deploy.md`
- `docs/database-design.md`
