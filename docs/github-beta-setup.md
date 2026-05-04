# GitHub Beta Setup

This guide is for putting the local D&D Encounter Builder repo onto GitHub
without exposing secrets.

## Before Creating The Repo

Confirm these are true:

- `npm run lint` passes.
- `npm run build` passes.
- `.env.local` is not staged.
- `.env.example` has placeholders only.
- No Supabase service role key is in the repo.

## Create The GitHub Repo

1. Go to GitHub.
2. Choose New repository.
3. Recommended repo name:
   - `dnd-encounter-builder`
   - or `encounter-builder`
4. Keep it private while preparing beta unless you intentionally want it public.
5. Do not initialize with a README, `.gitignore`, or license because this local
   repo already has those project files.
6. Create the repository.
7. Copy the repository remote URL.

## Add The Remote Locally

Use the URL GitHub gives you:

```bash
git remote add origin <YOUR_GITHUB_REMOTE_URL>
git branch -M main
git push -u origin main
```

Do not force push.

If `git remote -v` already shows a remote, stop and make sure it is the correct
GitHub repo before pushing.

## Verify On GitHub

After pushing:

- Confirm the files appear in the GitHub repo.
- Confirm `.env.local` is not present.
- Confirm no secret values are visible in `.env.example`.
- Confirm README renders.
- Confirm docs are present under `docs/`.

## Important Safety Notes

- Never upload `.env.local`.
- Never paste a Supabase service role key into GitHub.
- Vercel should use only public `NEXT_PUBLIC_*` browser-safe values for this app.
- Keep `NEXT_PUBLIC_USE_DEMO_DATA=false` for beta/prod unless you intentionally
  want a demo deployment.
- Keep `NEXT_PUBLIC_ENABLE_SRD_IMPORT=false` for beta/prod until the SRD
  importer is stable.
