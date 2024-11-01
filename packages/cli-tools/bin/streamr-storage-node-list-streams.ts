#!/usr/bin/env node
import '../src/logLevel'

import EasyTable from 'easy-table'
import { StreamrClient } from '@streamr/sdk'
import { createClientCommand } from '../src/command'

createClientCommand((async (client: StreamrClient, storageNodeAddress: string) => {
    const { streams } = await client.getStoredStreams(storageNodeAddress)
    if (streams.length > 0) {
        console.info(EasyTable.print(streams.map((stream) => {
            return {
                id: stream.id,
                partitions: stream.getPartitionCount()
            }
        })))
    }
}))
    .arguments('<storageNodeAddress>')
    .description('list stream parts in a storage node')
    .parseAsync()
