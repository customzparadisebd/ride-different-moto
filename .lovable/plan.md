# Owner login: password reset + account clarity

## Answer first

- Admin email: **customzparadisebd@gmail.com** (bootstrap Super Admin).
- Login page: **/czp-ops-9f2c/access**
- Password: not retrievable by anyone. Passwords live only as hashes in the auth system, so a password can be set (sign up) or reset — never read back.

## What this change does

1. **Working password reset.** The login page already sends a reset email, but the link returns to the sign-in page, which has no way to set a new password — so the reset never completes. Add a dedicated `/czp-ops-9f2c/reset-password` page that detects the recovery link, asks for a new password twice (with the existing show/hide eye field), enforces a minimum length, saves it, records the change in the audit log, and sends the user back to sign in. Point the reset email at this page.

2. **Clear owner guidance on the login page.** A short note under the form: if the owner account does not exist yet, use Sign up once with the owner email (it becomes Super Admin automatically); if it exists, use "Forgot password".

3. **Fix the login page flicker.** The access page currently throws a hydration mismatch on load (server and client render different markup). Render the auth form only after mount so the page loads cleanly.

## Notes

- No password is ever displayed, logged, or stored in the project.
- Reset messages stay generic ("if that account exists...") so account existence is never revealed.
- The reset page is public (it must work before sign-in) and is marked noindex/nofollow like the other admin pages.
- After a reset the owner still completes TOTP (MFA) before the panel opens; if the authenticator is lost, a recovery code from setup is required.
- DEVELOPER_NOTES.md gets an entry for the reset flow.

## Technical details

- New route `src/routes/czp-ops-9f2c.reset-password.tsx`: reads the recovery session from the URL hash via the auth client, then `updateUser({ password })`; uses `PasswordInput`; `noindex, nofollow, noarchive` head; redirects to `/czp-ops-9f2c/access` on success.
- `src/routes/czp-ops-9f2c.access.tsx`: change `resetPasswordForEmail` `redirectTo` to `${origin}/czp-ops-9f2c/reset-password`; add the owner note; gate render on a mounted flag to remove the hydration mismatch.
- Audit: log a `security.password_reset` action through the existing admin audit writer.
- `public/robots.txt` already disallows the whole `/czp-ops-9f2c` path, so no change needed.