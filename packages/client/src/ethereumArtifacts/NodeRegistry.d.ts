import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from "ethers";
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from "../../common";
export declare namespace NodeRegistry {
    type NodeStruct = {
        nodeAddress: AddressLike;
        metadata: string;
        lastSeen: BigNumberish;
    };
    type NodeStructOutput = [
        nodeAddress: string,
        metadata: string,
        lastSeen: bigint
    ] & {
        nodeAddress: string;
        metadata: string;
        lastSeen: bigint;
    };
}
export interface NodeRegistryInterface extends Interface {
    getFunction(nameOrSignature: "createOrUpdateNode" | "createOrUpdateNodeSelf" | "getNode" | "getNodeByNumber" | "getNodes" | "headNode" | "initialize" | "kickOut" | "nodeCount" | "nodes" | "owner" | "proxiableUUID" | "removeNode" | "removeNodeSelf" | "renounceOwnership" | "requiresWhitelist" | "setRequiresWhitelist" | "tailNode" | "transferOwnership" | "upgradeTo" | "upgradeToAndCall" | "whitelist" | "whitelistApproveNode" | "whitelistRejectNode"): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: "AdminChanged" | "BeaconUpgraded" | "Initialized" | "NodeRemoved" | "NodeUpdated" | "NodeWhitelistApproved" | "NodeWhitelistRejected" | "OwnershipTransferred" | "RequiresWhitelistChanged" | "Upgraded"): EventFragment;
    encodeFunctionData(functionFragment: "createOrUpdateNode", values: [AddressLike, string]): string;
    encodeFunctionData(functionFragment: "createOrUpdateNodeSelf", values: [string]): string;
    encodeFunctionData(functionFragment: "getNode", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "getNodeByNumber", values: [BigNumberish]): string;
    encodeFunctionData(functionFragment: "getNodes", values?: undefined): string;
    encodeFunctionData(functionFragment: "headNode", values?: undefined): string;
    encodeFunctionData(functionFragment: "initialize", values: [AddressLike, boolean, AddressLike[], string[]]): string;
    encodeFunctionData(functionFragment: "kickOut", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "nodeCount", values?: undefined): string;
    encodeFunctionData(functionFragment: "nodes", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "owner", values?: undefined): string;
    encodeFunctionData(functionFragment: "proxiableUUID", values?: undefined): string;
    encodeFunctionData(functionFragment: "removeNode", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "removeNodeSelf", values?: undefined): string;
    encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
    encodeFunctionData(functionFragment: "requiresWhitelist", values?: undefined): string;
    encodeFunctionData(functionFragment: "setRequiresWhitelist", values: [boolean]): string;
    encodeFunctionData(functionFragment: "tailNode", values?: undefined): string;
    encodeFunctionData(functionFragment: "transferOwnership", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "upgradeTo", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "upgradeToAndCall", values: [AddressLike, BytesLike]): string;
    encodeFunctionData(functionFragment: "whitelist", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "whitelistApproveNode", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "whitelistRejectNode", values: [AddressLike]): string;
    decodeFunctionResult(functionFragment: "createOrUpdateNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "createOrUpdateNodeSelf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getNodeByNumber", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getNodes", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "headNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "kickOut", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nodeCount", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nodes", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "proxiableUUID", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeNodeSelf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "requiresWhitelist", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setRequiresWhitelist", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "tailNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "upgradeTo", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "upgradeToAndCall", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "whitelist", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "whitelistApproveNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "whitelistRejectNode", data: BytesLike): Result;
}
export declare namespace AdminChangedEvent {
    type InputTuple = [previousAdmin: AddressLike, newAdmin: AddressLike];
    type OutputTuple = [previousAdmin: string, newAdmin: string];
    interface OutputObject {
        previousAdmin: string;
        newAdmin: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace BeaconUpgradedEvent {
    type InputTuple = [beacon: AddressLike];
    type OutputTuple = [beacon: string];
    interface OutputObject {
        beacon: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace InitializedEvent {
    type InputTuple = [version: BigNumberish];
    type OutputTuple = [version: bigint];
    interface OutputObject {
        version: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace NodeRemovedEvent {
    type InputTuple = [nodeAddress: AddressLike];
    type OutputTuple = [nodeAddress: string];
    interface OutputObject {
        nodeAddress: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace NodeUpdatedEvent {
    type InputTuple = [
        nodeAddress: AddressLike,
        metadata: string,
        isNew: BigNumberish,
        lastSeen: BigNumberish
    ];
    type OutputTuple = [
        nodeAddress: string,
        metadata: string,
        isNew: bigint,
        lastSeen: bigint
    ];
    interface OutputObject {
        nodeAddress: string;
        metadata: string;
        isNew: bigint;
        lastSeen: bigint;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace NodeWhitelistApprovedEvent {
    type InputTuple = [nodeAddress: AddressLike];
    type OutputTuple = [nodeAddress: string];
    interface OutputObject {
        nodeAddress: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace NodeWhitelistRejectedEvent {
    type InputTuple = [nodeAddress: AddressLike];
    type OutputTuple = [nodeAddress: string];
    interface OutputObject {
        nodeAddress: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace OwnershipTransferredEvent {
    type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
    type OutputTuple = [previousOwner: string, newOwner: string];
    interface OutputObject {
        previousOwner: string;
        newOwner: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace RequiresWhitelistChangedEvent {
    type InputTuple = [value: boolean];
    type OutputTuple = [value: boolean];
    interface OutputObject {
        value: boolean;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export declare namespace UpgradedEvent {
    type InputTuple = [implementation: AddressLike];
    type OutputTuple = [implementation: string];
    interface OutputObject {
        implementation: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
}
export interface NodeRegistry extends BaseContract {
    connect(runner?: ContractRunner | null): NodeRegistry;
    waitForDeployment(): Promise<this>;
    interface: NodeRegistryInterface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    createOrUpdateNode: TypedContractMethod<[
        node: AddressLike,
        metadata_: string
    ], [
        void
    ], "nonpayable">;
    createOrUpdateNodeSelf: TypedContractMethod<[
        metadata_: string
    ], [
        void
    ], "nonpayable">;
    getNode: TypedContractMethod<[
        nodeAddress: AddressLike
    ], [
        NodeRegistry.NodeStructOutput
    ], "view">;
    getNodeByNumber: TypedContractMethod<[
        i: BigNumberish
    ], [
        NodeRegistry.NodeStructOutput
    ], "view">;
    getNodes: TypedContractMethod<[], [NodeRegistry.NodeStructOutput[]], "view">;
    headNode: TypedContractMethod<[], [string], "view">;
    initialize: TypedContractMethod<[
        owner: AddressLike,
        requiresWhitelist_: boolean,
        initialNodes: AddressLike[],
        initialMetadata: string[]
    ], [
        void
    ], "nonpayable">;
    kickOut: TypedContractMethod<[
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    nodeCount: TypedContractMethod<[], [bigint], "view">;
    nodes: TypedContractMethod<[
        arg0: AddressLike
    ], [
        [
            NodeRegistry.NodeStructOutput,
            string,
            string
        ] & {
            node: NodeRegistry.NodeStructOutput;
            next: string;
            prev: string;
        }
    ], "view">;
    owner: TypedContractMethod<[], [string], "view">;
    proxiableUUID: TypedContractMethod<[], [string], "view">;
    removeNode: TypedContractMethod<[
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    removeNodeSelf: TypedContractMethod<[], [void], "nonpayable">;
    renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;
    requiresWhitelist: TypedContractMethod<[], [boolean], "view">;
    setRequiresWhitelist: TypedContractMethod<[
        value: boolean
    ], [
        void
    ], "nonpayable">;
    tailNode: TypedContractMethod<[], [string], "view">;
    transferOwnership: TypedContractMethod<[
        newOwner: AddressLike
    ], [
        void
    ], "nonpayable">;
    upgradeTo: TypedContractMethod<[
        newImplementation: AddressLike
    ], [
        void
    ], "nonpayable">;
    upgradeToAndCall: TypedContractMethod<[
        newImplementation: AddressLike,
        data: BytesLike
    ], [
        void
    ], "payable">;
    whitelist: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
    whitelistApproveNode: TypedContractMethod<[
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    whitelistRejectNode: TypedContractMethod<[
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: "createOrUpdateNode"): TypedContractMethod<[
        node: AddressLike,
        metadata_: string
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "createOrUpdateNodeSelf"): TypedContractMethod<[metadata_: string], [void], "nonpayable">;
    getFunction(nameOrSignature: "getNode"): TypedContractMethod<[
        nodeAddress: AddressLike
    ], [
        NodeRegistry.NodeStructOutput
    ], "view">;
    getFunction(nameOrSignature: "getNodeByNumber"): TypedContractMethod<[
        i: BigNumberish
    ], [
        NodeRegistry.NodeStructOutput
    ], "view">;
    getFunction(nameOrSignature: "getNodes"): TypedContractMethod<[], [NodeRegistry.NodeStructOutput[]], "view">;
    getFunction(nameOrSignature: "headNode"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "initialize"): TypedContractMethod<[
        owner: AddressLike,
        requiresWhitelist_: boolean,
        initialNodes: AddressLike[],
        initialMetadata: string[]
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "kickOut"): TypedContractMethod<[nodeAddress: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "nodeCount"): TypedContractMethod<[], [bigint], "view">;
    getFunction(nameOrSignature: "nodes"): TypedContractMethod<[
        arg0: AddressLike
    ], [
        [
            NodeRegistry.NodeStructOutput,
            string,
            string
        ] & {
            node: NodeRegistry.NodeStructOutput;
            next: string;
            prev: string;
        }
    ], "view">;
    getFunction(nameOrSignature: "owner"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "proxiableUUID"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "removeNode"): TypedContractMethod<[nodeAddress: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "removeNodeSelf"): TypedContractMethod<[], [void], "nonpayable">;
    getFunction(nameOrSignature: "renounceOwnership"): TypedContractMethod<[], [void], "nonpayable">;
    getFunction(nameOrSignature: "requiresWhitelist"): TypedContractMethod<[], [boolean], "view">;
    getFunction(nameOrSignature: "setRequiresWhitelist"): TypedContractMethod<[value: boolean], [void], "nonpayable">;
    getFunction(nameOrSignature: "tailNode"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "transferOwnership"): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "upgradeTo"): TypedContractMethod<[
        newImplementation: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "upgradeToAndCall"): TypedContractMethod<[
        newImplementation: AddressLike,
        data: BytesLike
    ], [
        void
    ], "payable">;
    getFunction(nameOrSignature: "whitelist"): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
    getFunction(nameOrSignature: "whitelistApproveNode"): TypedContractMethod<[nodeAddress: AddressLike], [void], "nonpayable">;
    getFunction(nameOrSignature: "whitelistRejectNode"): TypedContractMethod<[nodeAddress: AddressLike], [void], "nonpayable">;
    getEvent(key: "AdminChanged"): TypedContractEvent<AdminChangedEvent.InputTuple, AdminChangedEvent.OutputTuple, AdminChangedEvent.OutputObject>;
    getEvent(key: "BeaconUpgraded"): TypedContractEvent<BeaconUpgradedEvent.InputTuple, BeaconUpgradedEvent.OutputTuple, BeaconUpgradedEvent.OutputObject>;
    getEvent(key: "Initialized"): TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
    getEvent(key: "NodeRemoved"): TypedContractEvent<NodeRemovedEvent.InputTuple, NodeRemovedEvent.OutputTuple, NodeRemovedEvent.OutputObject>;
    getEvent(key: "NodeUpdated"): TypedContractEvent<NodeUpdatedEvent.InputTuple, NodeUpdatedEvent.OutputTuple, NodeUpdatedEvent.OutputObject>;
    getEvent(key: "NodeWhitelistApproved"): TypedContractEvent<NodeWhitelistApprovedEvent.InputTuple, NodeWhitelistApprovedEvent.OutputTuple, NodeWhitelistApprovedEvent.OutputObject>;
    getEvent(key: "NodeWhitelistRejected"): TypedContractEvent<NodeWhitelistRejectedEvent.InputTuple, NodeWhitelistRejectedEvent.OutputTuple, NodeWhitelistRejectedEvent.OutputObject>;
    getEvent(key: "OwnershipTransferred"): TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
    getEvent(key: "RequiresWhitelistChanged"): TypedContractEvent<RequiresWhitelistChangedEvent.InputTuple, RequiresWhitelistChangedEvent.OutputTuple, RequiresWhitelistChangedEvent.OutputObject>;
    getEvent(key: "Upgraded"): TypedContractEvent<UpgradedEvent.InputTuple, UpgradedEvent.OutputTuple, UpgradedEvent.OutputObject>;
    filters: {
        "AdminChanged(address,address)": TypedContractEvent<AdminChangedEvent.InputTuple, AdminChangedEvent.OutputTuple, AdminChangedEvent.OutputObject>;
        AdminChanged: TypedContractEvent<AdminChangedEvent.InputTuple, AdminChangedEvent.OutputTuple, AdminChangedEvent.OutputObject>;
        "BeaconUpgraded(address)": TypedContractEvent<BeaconUpgradedEvent.InputTuple, BeaconUpgradedEvent.OutputTuple, BeaconUpgradedEvent.OutputObject>;
        BeaconUpgraded: TypedContractEvent<BeaconUpgradedEvent.InputTuple, BeaconUpgradedEvent.OutputTuple, BeaconUpgradedEvent.OutputObject>;
        "Initialized(uint8)": TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        Initialized: TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        "NodeRemoved(address)": TypedContractEvent<NodeRemovedEvent.InputTuple, NodeRemovedEvent.OutputTuple, NodeRemovedEvent.OutputObject>;
        NodeRemoved: TypedContractEvent<NodeRemovedEvent.InputTuple, NodeRemovedEvent.OutputTuple, NodeRemovedEvent.OutputObject>;
        "NodeUpdated(address,string,uint256,uint256)": TypedContractEvent<NodeUpdatedEvent.InputTuple, NodeUpdatedEvent.OutputTuple, NodeUpdatedEvent.OutputObject>;
        NodeUpdated: TypedContractEvent<NodeUpdatedEvent.InputTuple, NodeUpdatedEvent.OutputTuple, NodeUpdatedEvent.OutputObject>;
        "NodeWhitelistApproved(address)": TypedContractEvent<NodeWhitelistApprovedEvent.InputTuple, NodeWhitelistApprovedEvent.OutputTuple, NodeWhitelistApprovedEvent.OutputObject>;
        NodeWhitelistApproved: TypedContractEvent<NodeWhitelistApprovedEvent.InputTuple, NodeWhitelistApprovedEvent.OutputTuple, NodeWhitelistApprovedEvent.OutputObject>;
        "NodeWhitelistRejected(address)": TypedContractEvent<NodeWhitelistRejectedEvent.InputTuple, NodeWhitelistRejectedEvent.OutputTuple, NodeWhitelistRejectedEvent.OutputObject>;
        NodeWhitelistRejected: TypedContractEvent<NodeWhitelistRejectedEvent.InputTuple, NodeWhitelistRejectedEvent.OutputTuple, NodeWhitelistRejectedEvent.OutputObject>;
        "OwnershipTransferred(address,address)": TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
        OwnershipTransferred: TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
        "RequiresWhitelistChanged(bool)": TypedContractEvent<RequiresWhitelistChangedEvent.InputTuple, RequiresWhitelistChangedEvent.OutputTuple, RequiresWhitelistChangedEvent.OutputObject>;
        RequiresWhitelistChanged: TypedContractEvent<RequiresWhitelistChangedEvent.InputTuple, RequiresWhitelistChangedEvent.OutputTuple, RequiresWhitelistChangedEvent.OutputObject>;
        "Upgraded(address)": TypedContractEvent<UpgradedEvent.InputTuple, UpgradedEvent.OutputTuple, UpgradedEvent.OutputObject>;
        Upgraded: TypedContractEvent<UpgradedEvent.InputTuple, UpgradedEvent.OutputTuple, UpgradedEvent.OutputObject>;
    };
}
