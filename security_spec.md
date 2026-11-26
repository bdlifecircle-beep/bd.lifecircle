# Security Specification — lifecircle.bd

## 1. Data Invariants
1. **Admin-Only Storefront Control**: Only verified admins (`bd.lifecircle@gmail.com` with `email_verified == true` or users explicitly listed in `/admins/{uid}`) may create, update, or delete `/banners`, `/siteSettings`, `/products`, `/diseases`, `/hospitals`, `/faqs`, or `/admins`.
2. **PII Isolation**: User profiles (`/users/{uid}`) containing email, phone, and address are readable only by the owning user (`request.auth.uid == uid`) or verified admins; list queries on `/users` are restricted exclusively to admins.
3. **2FA Secret Isolation**: TOTP secrets and backup codes (`/users/{uid}/security/{secId}`) are readable and writable solely by the owning user (`request.auth.uid == uid`), never by other users or admins.
4. **Strict Ownership & Immutability**: Appointments, orders, feedback, and chat threads require `ownerUid == request.auth.uid` on creation, forbid changing `ownerUid` or `createdAt` on update, and enforce `request.time` server timestamps.
5. **Terminal State Locking**: Once an appointment or order reaches a terminal state (`completed`, `cancelled`, `delivered`), non-admin users cannot modify it.
6. **Master Gate on Subcollections**: Chat messages inside `/chatThreads/{threadId}/messages/{messageId}` verify parent thread ownership (`get(.../chatThreads/$(threadId)).data.ownerUid == request.auth.uid`) or `isAdmin()`, and `list` rules enforce `resource.data.threadOwnerUid == request.auth.uid || isAdmin()` without performing `get()` inside `list`.
7. **Shadow Field Rejection**: Every collection uses `keys().hasAll(...) && keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update actions.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Non-Admin Banner Upload**: Customer attempts `create` on `/banners/evil1` to inject an unauthorized slidebar image.
2. **Non-Admin Address Hijack**: Customer attempts `update` on `/siteSettings/main` to alter company phone/address.
3. **Self-Assigned Admin Escalation**: Customer attempts `create` on `/admins/{theirUid}` with `role: "admin"`.
4. **Email Spoof Without Verification**: Attacker with unverified email `bd.lifecircle@gmail.com` (`email_verified: false`) attempts admin mutation.
5. **Cross-User PII Read**: Authenticated user A attempts `get` on `/users/{userB}` to steal phone/address.
6. **User Directory Scraping**: Non-admin user attempts `list` on `/users`.
7. **2FA Secret Theft**: Admin or another user attempts `get` on `/users/{userA}/security/totp`.
8. **Appointment Owner Spoofing**: User A attempts `create` on `/appointments/a1` with `ownerUid: "userB"`.
9. **Appointment Status Bypass**: User A attempts `update` on their own appointment to set `status: "confirmed"` directly.
10. **Shadow Field Injection**: User A creates `/feedback/f1` with an extra ghost field `isFeatured: true`.
11. **Chat Thread Impersonation**: User A creates `/chatThreads/{userB}/messages/m1` with `senderRole: "admin"`.
12. **Client Timestamp Forgery**: User A creates `/appointments/a2` with backdated `createdAt` not matching `request.time`.
