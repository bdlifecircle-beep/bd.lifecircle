/**
 * Security Rules Verification Suite (Dirty Dozen Attack Vectors)
 * Documents and verifies expected PERMISSION_DENIED outcomes for lifecircle.bd.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  path: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  enforcingGate: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Non-admin banner upload',
    path: '/banners/evil1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isAdmin() check on /banners/{bannerId}',
  },
  {
    id: 2,
    name: 'Non-admin site address hijack',
    path: '/siteSettings/main',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isAdmin() check on /siteSettings/{settingId}',
  },
  {
    id: 3,
    name: 'Self-assigned admin escalation',
    path: '/admins/attackerUid',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isAdmin() check on /admins/{uid}',
  },
  {
    id: 4,
    name: 'Unverified admin email spoof',
    path: '/banners/spoof1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'request.auth.token.email_verified == true in isBootstrappedAdmin()',
  },
  {
    id: 5,
    name: 'Cross-user PII read',
    path: '/users/victimUid',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isOwner(uid) || isStaffOrAdmin() on /users/{uid}',
  },
  {
    id: 6,
    name: 'User directory scraping',
    path: '/users',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isStaffOrAdmin() on /users/{uid} list',
  },
  {
    id: 7,
    name: '2FA TOTP secret theft by non-owner',
    path: '/users/victimUid/security/totp',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isOwner(uid) strict isolation on /users/{uid}/security/{secId}',
  },
  {
    id: 8,
    name: 'Appointment ownerUid spoofing',
    path: '/appointments/a1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().ownerUid == request.auth.uid',
  },
  {
    id: 9,
    name: 'Customer appointment status bypass to confirmed',
    path: '/appointments/a1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().status == "cancelled" for non-admin owner update',
  },
  {
    id: 10,
    name: 'Shadow field injection on feedback',
    path: '/feedback/f1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'keys().hasOnly([...]) in isValidFeedback()',
  },
  {
    id: 11,
    name: 'Chat message role impersonation',
    path: '/chatThreads/victimUid/messages/m1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'Master Gate get(chatThreads/threadId).data.ownerUid == request.auth.uid && senderRole == "customer"',
  },
  {
    id: 12,
    name: 'Backdated client timestamp forgery',
    path: '/appointments/a2',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().createdAt == request.time && incoming().updatedAt == request.time',
  },
];
