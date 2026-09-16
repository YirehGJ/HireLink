import { ref, uploadBytesResumable, type FirebaseStorage, type UploadTaskSnapshot } from "firebase/storage";

/**
 * @fileOverview Sube el CV (PDF) de un candidato a Storage de forma resumible,
 * para no bloquear la interfaz mientras se procesa un archivo pesado.
 */

export function uploadResume(
  storage: FirebaseStorage,
  uid: string,
  file: File,
  onProgress?: (pct: number) => void
): { promise: Promise<string>; cancel: () => void } {
  const path = `resumes/${uid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  const promise = new Promise<string>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(pct);
      },
      (error) => reject(error),
      () => resolve(path)
    );
  });

  return { promise, cancel: () => task.cancel() };
}
