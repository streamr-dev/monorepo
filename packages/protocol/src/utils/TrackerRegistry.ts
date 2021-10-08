import { Contract, providers } from 'ethers'
import { ConnectionInfo } from 'ethers/lib/utils'

import { keyToArrayIndex } from './HashUtil'

import * as trackerRegistryConfig from '../../contracts/TrackerRegistry.json'

const { JsonRpcProvider } = providers

export type SmartContractRecord = {
    id: string
    http: string
    ws: string
}

export type TrackerInfo = SmartContractRecord | string

export class TrackerRegistry<T extends TrackerInfo> {
    private readonly records: T[]

    constructor(records: T[]) {
        this.records = records.slice() // copy before mutating
        this.records.sort()  // TODO does this actually sort anything?
    }

    getTracker(streamId: string, partition = 0): T {
        if (typeof streamId !== 'string' || streamId.indexOf('::') >= 0) {
            throw new Error(`invalid id: ${streamId}`)
        }
        if (!Number.isInteger(partition) || partition < 0) {
            throw new Error(`invalid partition: ${partition}`)
        }

        const streamKey = `${streamId}::${partition}`

        const index = keyToArrayIndex(this.records.length, streamKey)
        return this.records[index]
    }

    getAllTrackers(): T[] {
        return this.records
    }
}

async function fetchTrackers(contractAddress: string, jsonRpcProvider: string | ConnectionInfo) {
    const provider = new JsonRpcProvider(jsonRpcProvider)
    // check that provider is connected and has some valid blockNumber
    await provider.getBlockNumber()

    const contract = new Contract(contractAddress, trackerRegistryConfig.abi, provider)
    // check that contract is connected
    await contract.addressPromise

    if (typeof contract.getNodes !== 'function') {
        throw Error(`getNodes function is not defined in smart contract (${contractAddress})`)
    }

    return await contract.getNodes()
}

export function createTrackerRegistry<T extends TrackerInfo>(servers: T[]): TrackerRegistry<T> {
    return new TrackerRegistry(servers)
}

export async function getTrackerRegistryFromContract({
    contractAddress,
    jsonRpcProvider
}: {
    contractAddress: string,
    jsonRpcProvider: string | ConnectionInfo
}): Promise<TrackerRegistry<SmartContractRecord>> {
    const trackers = await fetchTrackers(contractAddress, jsonRpcProvider)
    const records: SmartContractRecord[] = []
    for (let i = 0; i < trackers.length; ++i) {
        const { metadata, url, nodeAddress } = trackers[i]
        try {
            // The field is tracker.metadata in newer contracts and tracker.url in old contracts.
            // It's safe to clean up tracker.url when no such contract is used anymore.
            const urls = JSON.parse(metadata || url)
            records.push({
                id: nodeAddress,
                ...urls
            })
        } catch (e) {
            throw new Error(`Element trackers[${i}] not parsable as object: ${trackers[i]}`)
        }
    }
    return createTrackerRegistry(records)
}
