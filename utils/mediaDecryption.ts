import nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';

/**
 * Scarica e decifra un file precedentemente cifrato con `encryptFileBeforeUpload`
 * Restituisce un Blob decifrato
 */
export async function decryptDownloadedFile(
  url: string,
  encryption: { key: string; nonce: string }
): Promise<Blob> {
  // 1. Scarica i byte cifrati
  const response = await fetch(url);
  const encryptedBuffer = await response.arrayBuffer();
  const encryptedBytes = new Uint8Array(encryptedBuffer);

  // 2. Decodifica key e nonce da base64
  const key = naclUtil.decodeBase64(encryption.key);
  const nonce = naclUtil.decodeBase64(encryption.nonce);

  // 3. Decifra
  const decryptedBytes = nacl.secretbox.open(encryptedBytes, nonce, key);
  if (!decryptedBytes) {
    throw new Error('Decifratura fallita: chiave o nonce non validi');
  }

  // 4. Converte in Blob compatibile
  const buffer = new Uint8Array(decryptedBytes).buffer;
  return new Blob([buffer], { type: 'application/octet-stream' });
}


/**
 * Decifra un file a partire da un ArrayBuffer (es. da un download fetch).
 * @param encryptedBuffer Il contenuto cifrato (ArrayBuffer)
 * @param keyBase64 La chiave base64 (senderPublicKey o sharedKey)
 * @param nonceBase64 Il nonce base64
 * @returns un oggetto Blob decifrato pronto per essere usato
 */


/**
 * Decifra un file a partire da un ArrayBuffer (es. da un download fetch).
 * @param encryptedBuffer Il contenuto cifrato (ArrayBuffer)
 * @param keyBase64 La chiave base64 (senderPublicKey o sharedKey)
 * @param nonceBase64 Il nonce base64
 * @returns un oggetto Blob decifrato pronto per essere usato
 */
export async function decryptFileFromBlob(
  encryptedBuffer: ArrayBuffer,
  keyBase64: string,
  nonceBase64: string
): Promise<Blob> {
  const key = naclUtil.decodeBase64(keyBase64);
  const nonce = naclUtil.decodeBase64(nonceBase64);

  const ciphertext = new Uint8Array(encryptedBuffer); // OK
  const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
  if (!decrypted) throw new Error('Decryption failed');

  // Esplicita conversione per evitare errori TS
  const buffer = new Uint8Array(decrypted).buffer as ArrayBuffer;

  return new Blob([buffer], { type: 'audio/x-wav' });
}




import { Audio } from 'expo-av';

export async function playDecryptedAudio(url: string, keyBase64: string, nonceBase64: string) {
  try {
    // 1. Scarica il file cifrato
    const response = await fetch(url);
    const encryptedBuffer = await response.arrayBuffer();

    // 2. Decifra
    const decryptedBlob = await decryptFileFromBlob(encryptedBuffer, keyBase64, nonceBase64);

    // 3. Crea URI locale
    const blobUrl = URL.createObjectURL(decryptedBlob);

    // 4. Riproduci con expo-av
    const { sound } = await Audio.Sound.createAsync({ uri: blobUrl });
    await sound.playAsync();
  } catch (err) {
    console.error('Errore durante riproduzione audio cifrato:', err);
  }
}
