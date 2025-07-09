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
