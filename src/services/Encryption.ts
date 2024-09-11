import crypto from 'crypto';

export class EncryptionService {

  constructor() {}

  encrypt(data: string): string {
    const text = crypto.publicEncrypt({
      key: process.env.ENCRYPT_PUBLIC_KEY.replace(/\\n/g, '\n'),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
      // We convert the data string to a buffer
      Buffer.from(data)
    )

    return text.toString('base64');
  }

  decrypt(encryptedData: string): string {
    const decrypted = crypto.privateDecrypt(
      {
        key: process.env.ENCRYPT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        // In order to decrypt the data, we need to specify the
        // same hashing function and padding scheme that we used to
        // encrypt the data in the previous step
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encryptedData, 'base64')
    )

    return decrypted.toString();
  }
}
