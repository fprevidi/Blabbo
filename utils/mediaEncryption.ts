import nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';

/**
 * Cripta un file in forma binaria (es. immagine/audio)
 * @param uri URI del file locale (es. da ImagePicker)
 */
export async function encryptFileBeforeUpload(uri: string): Promise<{
  encryptedBlob: Blob;
  encryption: {
    key: string;   // base64
    nonce: string; // base64
  };
}> {
  // 1. scarica il contenuto binario del file da URI
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  // 2. genera chiave simmetrica e nonce
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

  // 3. cifra
  const encrypted = nacl.secretbox(fileBytes, nonce, key);

  // 4. crea blob dal contenuto cifrato
  const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });

  // 5. restituisci blob + chiavi codificate
  return {
    encryptedBlob,
    encryption: {
      key: naclUtil.encodeBase64(key),
      nonce: naclUtil.encodeBase64(nonce),
    },
  };
}
