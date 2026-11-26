import { getDriveAccessToken } from './firebase';

const BACKUP_FOLDER_NAME = 'lifecircle.bd Backups';
const BACKUP_FILE_NAME = 'lifecircle_bd_backup.json';

export interface DriveBackupPayload {
  app: 'lifecircle.bd';
  exportedAt: string;
  user: {
    uid: string;
    displayName: string;
    email: string;
    phone?: string;
    address?: string;
  };
  appointments: unknown[];
  orders: unknown[];
  feedback: unknown[];
  savedProductIds: string[];
  healthNotes?: string;
}

export interface DriveFileMeta {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

async function driveFetch(url: string, accessToken: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }
  return res;
}

async function ensureBackupFolder(accessToken: string): Promise<string> {
  const q = encodeURIComponent(
    `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    accessToken
  );
  const data = (await searchRes.json()) as { files?: { id: string; name: string }[] };
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const createRes = await driveFetch(
    'https://www.googleapis.com/drive/v3/files',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );
  const created = (await createRes.json()) as { id: string };
  return created.id;
}

export async function listDriveBackups(): Promise<DriveFileMeta[]> {
  const accessToken = getDriveAccessToken();
  if (!accessToken) {
    throw new Error('NO_DRIVE_TOKEN');
  }
  const folderId = await ensureBackupFolder(accessToken);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size)`,
    accessToken
  );
  const data = (await res.json()) as { files?: DriveFileMeta[] };
  return data.files ?? [];
}

export async function findExistingBackupFile(accessToken: string, folderId: string): Promise<DriveFileMeta | null> {
  const q = encodeURIComponent(
    `'${folderId}' in parents and name = '${BACKUP_FILE_NAME}' and trashed = false`
  );
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime,size)`,
    accessToken
  );
  const data = (await res.json()) as { files?: DriveFileMeta[] };
  return data.files?.[0] ?? null;
}

export async function checkBackupExists(): Promise<DriveFileMeta | null> {
  const accessToken = getDriveAccessToken();
  if (!accessToken) return null;
  const folderId = await ensureBackupFolder(accessToken);
  return findExistingBackupFile(accessToken, folderId);
}

export async function uploadBackupToDrive(
  payload: DriveBackupPayload,
  existingFileId?: string
): Promise<DriveFileMeta> {
  const accessToken = getDriveAccessToken();
  if (!accessToken) {
    throw new Error('NO_DRIVE_TOKEN');
  }

  const folderId = await ensureBackupFolder(accessToken);
  const targetFileId = existingFileId ?? (await findExistingBackupFile(accessToken, folderId))?.id;

  const metadata = targetFileId
    ? { name: BACKUP_FILE_NAME, mimeType: 'application/json' }
    : { name: BACKUP_FILE_NAME, parents: [folderId], mimeType: 'application/json' };

  const boundary = 'lifecircle_bd_boundary_948271';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(payload, null, 2)}\r\n` +
    `--${boundary}--`;

  const uploadUrl = targetFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${targetFileId}?uploadType=multipart&fields=id,name,modifiedTime,size`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size`;

  const res = await driveFetch(uploadUrl, accessToken, {
    method: targetFileId ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  return (await res.json()) as DriveFileMeta;
}

export async function downloadBackupFromDrive(fileId: string): Promise<DriveBackupPayload> {
  const accessToken = getDriveAccessToken();
  if (!accessToken) {
    throw new Error('NO_DRIVE_TOKEN');
  }
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    accessToken
  );
  return (await res.json()) as DriveBackupPayload;
}

export async function deleteBackupFromDrive(fileId: string): Promise<void> {
  const accessToken = getDriveAccessToken();
  if (!accessToken) {
    throw new Error('NO_DRIVE_TOKEN');
  }
  await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    accessToken,
    { method: 'DELETE' }
  );
}
