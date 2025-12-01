import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config';

export async function saveProfile(userId: string, data: Record<string, any>) {
  if (!userId) throw new Error('userId requerido');
  await setDoc(doc(db, 'users', userId), data, { merge: true });
}