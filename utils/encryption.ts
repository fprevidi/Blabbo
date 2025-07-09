// utils/encryption.ts

import nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { getRawKeyPair } from './crypto';
import { API_BASE_URL } from '../constants';

export async function encryptMessageForRecipient(
  toUserId: string,
  message: string
): Promise<{
  to: string;
  ciphertext: string;
  nonce: string;
  senderPublicKey: string;
}> {
  // 1. Recupera chiavi locali
  const keyPair = await getRawKeyPair();
  if (!keyPair) throw new Error('Chiavi locali non trovate');

  const senderSecretKey = keyPair.privateKey;
  const senderPublicKey = keyPair.publicKey;

  // 2. Recupera la public key del destinatario dal server
  const response = await fetch(`${API_BASE_URL}/users/${toUserId}/public-key`);
  if (!response.ok) throw new Error('Errore nel recupero della chiave pubblica');

  const { publicKey: recipientBase64 } = await response.json();
  const recipientPublicKey = naclUtil.decodeBase64(recipientBase64);

  // 3. Prepara i dati per la cifratura
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = naclUtil.decodeUTF8(message);

  // 4. Cifra
  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientPublicKey,
    senderSecretKey
  );

  return {
    to: toUserId,
    ciphertext: naclUtil.encodeBase64(encrypted),
    nonce: naclUtil.encodeBase64(nonce),
    senderPublicKey: naclUtil.encodeBase64(senderPublicKey)
  };
}


export async function decryptMessageFromSender(input: {
  ciphertext: string;
  nonce: string;
  senderPublicKey: string;
}): Promise<string> {
  const { ciphertext, nonce, senderPublicKey } = input;

  // 1. Decodifica base64
  const ciphertextBytes = naclUtil.decodeBase64(ciphertext);
  const nonceBytes = naclUtil.decodeBase64(nonce);
  const senderPubKeyBytes = naclUtil.decodeBase64(senderPublicKey);

  // 2. Recupera la chiave privata del destinatario
  const keyPair = await getRawKeyPair();
  if (!keyPair) throw new Error('Chiave privata mancante');

  // 3. Decifra
  const decrypted = nacl.box.open(
    ciphertextBytes,
    nonceBytes,
    senderPubKeyBytes,
    keyPair.privateKey
  );

  if (!decrypted) throw new Error('Impossibile decriptare il messaggio');

  // 4. Converti in stringa
  return naclUtil.encodeUTF8(decrypted);
}
