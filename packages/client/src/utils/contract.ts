import { Contract, ContractReceipt, ContractTransaction } from '@ethersproject/contracts'
import EventEmitter from 'eventemitter3'
import debug from 'debug'
import { NameDirectory } from 'streamr-network'
import pLimit from 'p-limit'

const log = debug('Streamr:contract')

export interface ContractEvent {
    onMethodExecute: (methodName: string) => void
    onTransactionSubmit: (methodName: string, tx: ContractTransaction) => void
    onTransactionConfirm: (methodName: string, tx: ContractTransaction, receipt: ContractReceipt) => void
}

export type ObservableContract<T extends Contract> = T & {
    eventEmitter: EventEmitter<ContractEvent>
}

export async function waitForTx(
    txToSubmit: Promise<ContractTransaction>
): Promise<ContractReceipt> {
    const tx = await txToSubmit
    return tx.wait()
}

const isTransaction = (returnValue: any): returnValue is ContractTransaction => {
    return (returnValue.wait !== undefined && (typeof returnValue.wait === 'function'))
}

const createLogger = (eventEmitter: EventEmitter<ContractEvent>): void => {
    eventEmitter.on('onMethodExecute', (methodName: string) => {
        log(`execute ${methodName}`)
    })
    eventEmitter.on('onTransactionSubmit', (methodName: string, tx: ContractTransaction) => {
        log(
            'transaction submitted { method=%s, tx=%s, to=%s, nonce=%d, gasLimit=%d, gasPrice=%d }',
            methodName,
            tx.hash,
            NameDirectory.getName(tx.to),
            tx.nonce,
            tx.gasLimit,
            tx.gasPrice
        )
    })
    eventEmitter.on('onTransactionConfirm', (methodName: string, tx: ContractTransaction, receipt: ContractReceipt) => {
        log(
            'transaction confirmed { method=%s, tx=%s, block=%d, confirmations=%d, gasUsed=%d, events=%j }',
            methodName,
            tx.hash,
            receipt.blockNumber,
            receipt.confirmations,
            receipt.gasUsed,
            (receipt.events || []).map((e) => e.event)
        )
    })
}

const withErrorHandling = async <T>(
    execute: () => Promise<T>,
    methodName: string
): Promise<T> => {
    try {
        return await execute()
    } catch (e: any) {
        const wrappedError = new Error(`Error in contract call "${methodName}"`)
        // @ts-expect-error unknown property
        wrappedError.reason = e
        throw wrappedError
    }
}

const createWrappedContractMethod = (
    originalMethod: (...args: any) => Promise<any>,
    methodName: string,
    eventEmitter: EventEmitter<ContractEvent>,
    concurrencyLimit: pLimit.Limit
) => {
    return async (...args: any) => {
        eventEmitter.emit('onMethodExecute', methodName)
        const returnValue = await withErrorHandling(() => concurrencyLimit(() => originalMethod(...args)), methodName)
        if (isTransaction(returnValue)) {
            const tx = returnValue
            const originalWaitMethod = tx.wait
            tx.wait = async (confirmations?: number): Promise<ContractReceipt> => {
                const receipt = await withErrorHandling(() => originalWaitMethod(confirmations), `${methodName}.wait`)
                eventEmitter.emit('onTransactionConfirm', methodName, tx, receipt)
                return receipt
            }
            eventEmitter.emit('onTransactionSubmit', methodName, tx)
        }
        return returnValue
    }
}

/**
 * Adds error handling, logging and limits concurrency.
 * 
 * You can use the decorated contract normally, e.g.:
 *     const tx = await contract.createFoobar(123)
 *     return await tx.wait()
 * or
 *     await contract.getFoobar(456)
 */
export const createDecoratedContract = <T extends Contract>(
    contract: Contract,
    contractName: string,
    maxConcurrentCalls: number
): ObservableContract<T> => {
    const eventEmitter = new EventEmitter<ContractEvent>()
    const methods: Record<string, () => Promise<any>> = {}
    const concurrencyLimit = pLimit(maxConcurrentCalls)
    /*
     * Wrap each contract function. We read the list of functions from contract.functions, but
     * actually delegate each method to contract[methodName]. Those methods are almost identical
     * to contract.functions[methodName] methods. The major difference is the way of handling
     * single-value results: the return type of contract.functions[methodName] is always
     * Promise<Result> (see https://docs.ethers.io/v5/api/contract/contract/#Contract--readonly)
     */
    Object.keys(contract.functions).forEach((methodName) => {
        methods[methodName] = createWrappedContractMethod(
            contract[methodName],
            `${contractName}.${methodName}`,
            eventEmitter,
            concurrencyLimit
        )
    })
    createLogger(eventEmitter)
    const result: any = {
        eventEmitter
    }
    // copy own properties and inherited properties (e.g. contract.removeAllListeners)
    // eslint-disable-next-line
    for (const key in contract) {
        result[key] = methods[key] !== undefined ? methods[key] : contract[key]
    }
    return result
}
