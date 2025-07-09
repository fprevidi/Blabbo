import nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants';

export async function generateKeyPairIfNotExists() {
  const existingPrivate = await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);
  const existingPublic = await SecureStore.getItemAsync(STORAGE_KEYS.PUBLIC_KEY);

  if (!existingPrivate || !existingPublic) {
    const keyPair = nacl.box.keyPair();

    const privateKeyBase64 = naclUtil.encodeBase64(keyPair.secretKey);
    const publicKeyBase64 = naclUtil.encodeBase64(keyPair.publicKey);

    await SecureStore.setItemAsync(STORAGE_KEYS.PRIVATE_KEY, privateKeyBase64);
    await SecureStore.setItemAsync(STORAGE_KEYS.PUBLIC_KEY, publicKeyBase64);

    console.log('🔐 Nuova coppia di chiavi generata');

    return {
      privateKey: keyPair.secretKey,
      publicKey: keyPair.publicKey,
    };
  } else {
    console.log('🔐 Coppia di chiavi già esistente');
    return {
      privateKey: naclUtil.decodeBase64(existingPrivate),
      publicKey: naclUtil.decodeBase64(existingPublic),
    };
  }
}

export async function getBase64PublicKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(STORAGE_KEYS.PUBLIC_KEY);
}

export async function getRawKeyPair() {
  const privateKey = await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);
  const publicKey = await SecureStore.getItemAsync(STORAGE_KEYS.PUBLIC_KEY);

  if (!privateKey || !publicKey) return null;

  return {
    privateKey: naclUtil.decodeBase64(privateKey),
    publicKey: naclUtil.decodeBase64(publicKey),
  };
}
