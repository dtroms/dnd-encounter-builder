# Product Boundaries

This document captures future planning notes for sign-up, sign-in, donations, subscriptions, imports, and content licensing boundaries.

It does not implement auth, payments, Stripe, donation links, subscription logic, Supabase Auth, RLS policies, official copyrighted D&D monster data, or website scraping.

## Future Account Features

The app should eventually support sign-up/sign-in for:

- saved encounters
- private creature libraries
- stat block imports
- cloud sync
- user settings
- support/subscription status

These features should build on the future auth-ready `owner_user_id` fields described in `docs/database-design.md`.

## Support And Subscription Boundaries

If subscriptions are added later, they should pay for software features such as:

- cloud storage
- saved encounters
- private libraries
- import/review tooling
- sync
- convenience features
- advanced organization

Subscriptions should not be framed as paying for access to Wizards IP, official D&D content, or non-SRD official monster data.

A donation/support model should remain a fallback or alternative if subscription boundaries are unclear. Donation/support status can be tracked separately from app content access, and should not imply that the app is selling official D&D material.

## Content Boundaries

The app should ship only with original sample content and SRD/Creative Commons content where properly attributed.

The app should not bundle:

- non-SRD official D&D monsters
- official D&D lore
- official D&D art
- official D&D stat blocks

User imports should be treated as private user-provided content. The app may later store user-provided imports for that user's own library, but it should not package, redistribute, or sell official monster data.

SRD/Creative Commons content may be usable commercially with proper attribution, depending on the exact source and license terms. It should be handled separately from non-SRD official content so the app can clearly distinguish what is bundled, what is user-provided, and what is not allowed.

## Importer Boundaries

The first importer should focus on paste-your-own-stat-block and user review before saving.

D&D Beyond URL import should remain future-only and should require legal and technical review before implementation. It should not scrape D&D Beyond or any other website, bypass access controls, or copy protected content.

## Review Before Paid Launch

Before any public launch with paid plans, the project should receive a dedicated licensing/legal review.

That review should cover Wizards/D&D content boundaries, SRD/Creative Commons attribution, user-provided imports, subscription feature framing, donation/support language, and any planned URL import behavior.
