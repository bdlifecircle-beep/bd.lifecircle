import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  'ai-studio-b41b0317-dc76-4e0d-8929-840ae9bd80ef';

export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firestoreDatabaseId
);

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory Drive access token (never stored in localStorage or sessionStorage)
let cachedDriveAccessToken: string | null = null;
let isSigningInFlag = false;

export const getDriveAccessToken = (): string | null => cachedDriveAccessToken;

export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string | null;
}> => {
  try {
    isSigningInFlag = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedDriveAccessToken = credential?.accessToken ?? null;
    return { user: result.user, accessToken: cachedDriveAccessToken };
  } finally {
    isSigningInFlag = false;
  }
};

export const signUpWithEmail = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  await sendEmailVerification(cred.user);
  return cred.user;
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const logoutUser = async (): Promise<void> => {
  cachedDriveAccessToken = null;
  await auth.signOut();
};

export const subscribeToAuth = (
  callback: (user: User | null, hasDriveToken: boolean) => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user && !isSigningInFlag) {
      cachedDriveAccessToken = null;
    }
    callback(user, !!cachedDriveAccessToken);
  });
};

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently operating in offline cache mode.');
    }
    return false;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
