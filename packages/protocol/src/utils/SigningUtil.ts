import secp256k1 from 'secp256k1'
import { Keccak } from 'sha3'
import { EthereumAddress } from './types'

const SIGN_MAGIC = '\u0019Ethereum Signed Message:\n'
const keccak = new Keccak(256)

function hash(messageBuffer: Buffer) {
    const prefixString = SIGN_MAGIC + messageBuffer.length
    const merged = Buffer.concat([Buffer.from(prefixString, 'utf-8'), messageBuffer])
    keccak.reset()
    keccak.update(merged)
    return keccak.digest('binary')
}

function recoverPublicKey(signatureBuffer: Buffer, payloadBuffer: Buffer) {
    const recoveryId = signatureBuffer.readUInt8(signatureBuffer.length - 1) - 27
    return secp256k1.ecdsaRecover(
        signatureBuffer.subarray(0, signatureBuffer.length - 1),
        recoveryId,
        hash(payloadBuffer),
        false,
        Buffer.alloc,
    )
}

/**
 * Creates and verifies standard Ethereum signatures. This is a faster 
 * implementation than found in ether.js library. It is compatible
 * with e.g. ether.js's verifyMessage and signMessage functions.
 * 
 * In Node environment the performance is significantly better compared 
 * to ether.js v5.5.0.
 * 
 * See test/benchmark/SigningUtils.ts and the original PR:
 * https://github.com/streamr-dev/streamr-client-protocol-js/pull/35
 */
export default class SigningUtil {
    static sign(payload: string, privateKey: string): string {
        const payloadBuffer = Buffer.from(payload, 'utf-8')
        const privateKeyBuffer = Buffer.from(SigningUtil.normalize(privateKey), 'hex')

        const msgHash = hash(payloadBuffer)
        const sigObj = secp256k1.ecdsaSign(msgHash, privateKeyBuffer)
        const result = Buffer.alloc(sigObj.signature.length + 1, Buffer.from(sigObj.signature))
        result.writeInt8(27 + sigObj.recid, result.length - 1)
        return '0x' + result.toString('hex')
    }

    static recover(
        signature: string,
        payload: string,
        publicKeyBuffer: Buffer | Uint8Array | undefined = undefined
    ): string {
        const signatureBuffer = Buffer.from(SigningUtil.normalize(signature), 'hex') // remove '0x' prefix
        const payloadBuffer = Buffer.from(payload, 'utf-8')

        if (!publicKeyBuffer) {
            // eslint-disable-next-line no-param-reassign
            publicKeyBuffer = recoverPublicKey(signatureBuffer, payloadBuffer)
        }
        const pubKeyWithoutFirstByte = publicKeyBuffer.subarray(1, publicKeyBuffer.length)
        keccak.reset()
        keccak.update(Buffer.from(pubKeyWithoutFirstByte))
        const hashOfPubKey = keccak.digest('binary')
        return '0x' + hashOfPubKey.subarray(12, hashOfPubKey.length).toString('hex')
    }

    static verify(address: EthereumAddress, payload: string, signature: string): boolean {
        try {
            const recoveredAddress = SigningUtil.recover(signature, payload)
            return recoveredAddress.toLowerCase() === address.toLowerCase()
        } catch (err) {
            return false
        }
    }

    private static normalize(privateKeyOrAddress: string): string {
        return privateKeyOrAddress.startsWith('0x') ? privateKeyOrAddress.substring(2) : privateKeyOrAddress
    }
}
