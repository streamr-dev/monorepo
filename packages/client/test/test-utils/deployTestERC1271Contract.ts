/* eslint-disable */
// TODO remove "eslint-disable"
import { fetchPrivateKeyWithGas } from '@streamr/test-utils'
import { createTestClient } from './utils'
import { ContractFactory } from 'ethers'
import TestERC1271Abi from '../ethereumArtifacts/TestERC1271Abi.json'
import { TestERC1271 } from '../ethereumArtifacts/TestERC1271'
import { EthereumAddress, Logger, toEthereumAddress } from '@streamr/utils'

// eslint-disable-next-line max-len
const MOCK_ERC1271_BYTECODE = '0x608060405234801561001057600080fd5b5061073e806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80631626ba7e14610051578063a39fac1214610082578063b810fb4314610097578063b9571721146100c2575b600080fd5b61006461005f366004610527565b6100d7565b6040516001600160e01b031990911681526020015b60405180910390f35b61008a610194565b60405161007991906105a3565b6100aa6100a53660046105f0565b6101f6565b6040516001600160a01b039091168152602001610079565b6100d56100d0366004610609565b610220565b005b60008061011a8585858080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061023192505050565b905060005b60005481101561017f576000818154811061013c5761013c61067e565b6000918252602090912001546001600160a01b039081169083160361016d5750630b135d3f60e11b915061018d9050565b80610177816106aa565b91505061011f565b506001600160e01b03199150505b9392505050565b606060008054806020026020016040519081016040528092919081815260200182805480156101ec57602002820191906000526020600020905b81546001600160a01b031681526001909101906020018083116101ce575b5050505050905090565b6000818154811061020657600080fd5b6000918252602090912001546001600160a01b0316905081565b61022c600083836104af565b505050565b6000815160411461029d5760405162461bcd60e51b815260206004820152603a60248201526000805160206106e983398151915260448201527f3a20696e76616c6964207369676e6174757265206c656e67746800000000000060648201526084015b60405180910390fd5b81516041146102e95760405162461bcd60e51b81526020600482015260186024820152770cae4e4dee4bec4c2c8a6d2cedcc2e8eae4ca98cadccee8d60431b6044820152606401610294565b60208201516040830151606084015160001a601b8110156103125761030f601b826106c3565b90505b8060ff16601b148061032757508060ff16601c145b61036f5760405162461bcd60e51b815260206004820152601960248201527832b93937b92fb130b229b4b3b730ba3ab932ab32b939b4b7b760391b6044820152606401610294565b6fa2a8918ca85bafe22016d0b997e4df60600160ff1b038211156103e95760405162461bcd60e51b815260206004820152603d60248201526000805160206106e983398151915260448201527f3a20696e76616c6964207369676e6174757265202773272076616c75650000006064820152608401610294565b60408051600081526020810180835288905260ff831691810191909152606081018490526080810183905260019060a0016020604051602081039080840390855afa15801561043c573d6000803e3d6000fd5b5050604051601f1901519450506001600160a01b0384166104a65760405162461bcd60e51b815260206004820152603060248201526000805160206106e983398151915260448201526f1d1024a72b20a624a22fa9a4a3a722a960811b6064820152608401610294565b50505092915050565b828054828255906000526020600020908101928215610502579160200282015b828111156105025781546001600160a01b0319166001600160a01b038435161782556020909201916001909101906104cf565b5061050e929150610512565b5090565b5b8082111561050e5760008155600101610513565b60008060006040848603121561053c57600080fd5b83359250602084013567ffffffffffffffff8082111561055b57600080fd5b818601915086601f83011261056f57600080fd5b81358181111561057e57600080fd5b87602082850101111561059057600080fd5b6020830194508093505050509250925092565b6020808252825182820181905260009190848201906040850190845b818110156105e45783516001600160a01b0316835292840192918401916001016105bf565b50909695505050505050565b60006020828403121561060257600080fd5b5035919050565b6000806020838503121561061c57600080fd5b823567ffffffffffffffff8082111561063457600080fd5b818501915085601f83011261064857600080fd5b81358181111561065757600080fd5b8660208260051b850101111561066c57600080fd5b60209290920196919550909350505050565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b6000600182016106bc576106bc610694565b5060010190565b600060ff821660ff84168060ff038211156106e0576106e0610694565b01939250505056fe5369676e617475726556616c696461746f72237265636f7665725369676e6572a26469706673582212204d63ca09e554a9f4f26eccc364f853af6151a0d89c0a649da9cb75b38a57ec4f64736f6c634300080d0033'

const logger = new Logger(module)

export async function deployTestERC1271Contract(allowedAddresses: EthereumAddress[]): Promise<EthereumAddress> {
    const privateKey = await fetchPrivateKeyWithGas()
    const client = createTestClient(privateKey)
    try {
        const deployerWallet = await client.getSigner()
        const factory = new ContractFactory(TestERC1271Abi, MOCK_ERC1271_BYTECODE, deployerWallet)
        const contract = await factory.deploy() as unknown as TestERC1271
        await contract.waitForDeployment()
        await contract.setAddresses(allowedAddresses)
        const contractAddress = await contract.getAddress()
        logger.info('Deployed TestERC1271 contract', { contractAddress, allowedAddresses })
        return toEthereumAddress(contractAddress)
    } finally {
        await client.destroy()
    }
}
