import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

export interface TotpSetupBundle {
  secret: string;
  uri: string;
  qrDataUrl: string;
  backupCodes: string[];
}

export function generateBackupCodes(count = 8): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  const arr = new Uint8Array(8);
  for (let i = 0; i < count; i++) {
    crypto.getRandomValues(arr);
    let code = '';
    for (let j = 0; j < 8; j++) {
      if (j === 4) code += '-';
      code += chars[arr[j] % chars.length];
    }
    codes.push(code);
  }
  return codes;
}

export async function createTotpSetup(accountLabel: string): Promise<TotpSetupBundle> {
  const secretObj = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'lifecircle.bd',
    label: accountLabel,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secretObj,
  });

  const uri = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(uri, {
    width: 200,
    margin: 2,
    color: { dark: '#1D2B53', light: '#FFFFFF' },
  });

  return {
    secret: secretObj.base32,
    uri,
    qrDataUrl,
    backupCodes: generateBackupCodes(8),
  };
}

export function verifyTotpCode(secretBase32: string, token: string): boolean {
  const cleaned = token.replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleaned)) return false;

  const totp = new OTPAuth.TOTP({
    issuer: 'lifecircle.bd',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token: cleaned, window: 1 });
  return delta !== null;
}
