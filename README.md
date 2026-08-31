# Lift Driver Production

Upload a Bin Transfer Productivity Excel report, enter each driver's pulldowns and accuracy errors, and calculate an explained daily performance score.

**Formula:** `Adjusted moves = bin moves + (pulldowns × 0.5) − (errors × 2)`

**Percentage:** `Adjusted moves ÷ 45 × 100`

The site is static and can be hosted with GitHub Pages from the `main` branch root.

## Supabase setup

1. Run `supabase-setup.sql` in the Supabase SQL Editor.
2. Create the supervisor account in Authentication > Users.
3. Add that user to `admin_users` using the final commented SQL statement.
4. Copy the project's publishable key into `config.js`.
5. To sync with PullDown Tracker, point that project to the same Supabase project and `pulldowns` table.
