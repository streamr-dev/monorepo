import type { BaseContract, BigNumberish, BytesLike, FunctionFragment, Result, Interface, EventFragment, AddressLike, ContractRunner, ContractMethod, Listener } from "ethers";
import type { TypedContractEvent, TypedDeferredTopicFilter, TypedEventLog, TypedLogDescription, TypedListener, TypedContractMethod } from "../../common";
export interface StreamStorageRegistryV2Interface extends Interface {
    getFunction(nameOrSignature: "addAndRemoveStorageNodes" | "addStorageNode" | "initialize" | "isStorageNodeOf" | "nodeRegistry" | "pairs" | "proxiableUUID" | "removeStorageNode" | "streamRegistry" | "upgradeTo" | "upgradeToAndCall"): FunctionFragment;
    getEvent(nameOrSignatureOrTopic: "Added" | "AdminChanged" | "BeaconUpgraded" | "Initialized" | "Removed" | "Upgraded"): EventFragment;
    encodeFunctionData(functionFragment: "addAndRemoveStorageNodes", values: [string, AddressLike[], AddressLike[]]): string;
    encodeFunctionData(functionFragment: "addStorageNode", values: [string, AddressLike]): string;
    encodeFunctionData(functionFragment: "initialize", values: [AddressLike, AddressLike, AddressLike]): string;
    encodeFunctionData(functionFragment: "isStorageNodeOf", values: [string, AddressLike]): string;
    encodeFunctionData(functionFragment: "nodeRegistry", values?: undefined): string;
    encodeFunctionData(functionFragment: "pairs", values: [string, AddressLike]): string;
    encodeFunctionData(functionFragment: "proxiableUUID", values?: undefined): string;
    encodeFunctionData(functionFragment: "removeStorageNode", values: [string, AddressLike]): string;
    encodeFunctionData(functionFragment: "streamRegistry", values?: undefined): string;
    encodeFunctionData(functionFragment: "upgradeTo", values: [AddressLike]): string;
    encodeFunctionData(functionFragment: "upgradeToAndCall", values: [AddressLike, BytesLike]): string;
    decodeFunctionResult(functionFragment: "addAndRemoveStorageNodes", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addStorageNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isStorageNodeOf", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nodeRegistry", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "pairs", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "proxiableUUID", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeStorageNode", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "streamRegistry", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "upgradeTo", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "upgradeToAndCall", data: BytesLike): Result;
}
export declare namespace AddedEvent {
    type InputTuple = [streamId: string, nodeAddress: AddressLike];
    type OutputTuple = [streamId: string, nodeAddress: string];
    interface OutputObject {
        streamId: string;
        nodeAddress: string;
    }
    type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
    type Filter = TypedDeferredTopicFilter<Event>;
    type Log = TypedEventLog<Event>;
    type LogDescription = TypedLogDescription<Event>;
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
export declare namespace RemovedEvent {
    type InputTuple = [streamId: string, nodeAddress: AddressLike];
    type OutputTuple = [streamId: string, nodeAddress: string];
    interface OutputObject {
        streamId: string;
        nodeAddress: string;
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
export interface StreamStorageRegistryV2 extends BaseContract {
    connect(runner?: ContractRunner | null): StreamStorageRegistryV2;
    waitForDeployment(): Promise<this>;
    interface: StreamStorageRegistryV2Interface;
    queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
    on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
    once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
    listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
    listeners(eventName?: string): Promise<Array<Listener>>;
    removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
    addAndRemoveStorageNodes: TypedContractMethod<[
        streamId: string,
        addNodes: AddressLike[],
        removeNodes: AddressLike[]
    ], [
        void
    ], "nonpayable">;
    addStorageNode: TypedContractMethod<[
        streamId: string,
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    initialize: TypedContractMethod<[
        streamRegistryAddress: AddressLike,
        nodeRegistryAddress: AddressLike,
        arg2: AddressLike
    ], [
        void
    ], "nonpayable">;
    isStorageNodeOf: TypedContractMethod<[
        streamId: string,
        nodeAddress: AddressLike
    ], [
        boolean
    ], "view">;
    nodeRegistry: TypedContractMethod<[], [string], "view">;
    pairs: TypedContractMethod<[
        arg0: string,
        arg1: AddressLike
    ], [
        bigint
    ], "view">;
    proxiableUUID: TypedContractMethod<[], [string], "view">;
    removeStorageNode: TypedContractMethod<[
        streamId: string,
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    streamRegistry: TypedContractMethod<[], [string], "view">;
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
    getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
    getFunction(nameOrSignature: "addAndRemoveStorageNodes"): TypedContractMethod<[
        streamId: string,
        addNodes: AddressLike[],
        removeNodes: AddressLike[]
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "addStorageNode"): TypedContractMethod<[
        streamId: string,
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "initialize"): TypedContractMethod<[
        streamRegistryAddress: AddressLike,
        nodeRegistryAddress: AddressLike,
        arg2: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "isStorageNodeOf"): TypedContractMethod<[
        streamId: string,
        nodeAddress: AddressLike
    ], [
        boolean
    ], "view">;
    getFunction(nameOrSignature: "nodeRegistry"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "pairs"): TypedContractMethod<[arg0: string, arg1: AddressLike], [bigint], "view">;
    getFunction(nameOrSignature: "proxiableUUID"): TypedContractMethod<[], [string], "view">;
    getFunction(nameOrSignature: "removeStorageNode"): TypedContractMethod<[
        streamId: string,
        nodeAddress: AddressLike
    ], [
        void
    ], "nonpayable">;
    getFunction(nameOrSignature: "streamRegistry"): TypedContractMethod<[], [string], "view">;
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
    getEvent(key: "Added"): TypedContractEvent<AddedEvent.InputTuple, AddedEvent.OutputTuple, AddedEvent.OutputObject>;
    getEvent(key: "AdminChanged"): TypedContractEvent<AdminChangedEvent.InputTuple, AdminChangedEvent.OutputTuple, AdminChangedEvent.OutputObject>;
    getEvent(key: "BeaconUpgraded"): TypedContractEvent<BeaconUpgradedEvent.InputTuple, BeaconUpgradedEvent.OutputTuple, BeaconUpgradedEvent.OutputObject>;
    getEvent(key: "Initialized"): TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
    getEvent(key: "Removed"): TypedContractEvent<RemovedEvent.InputTuple, RemovedEvent.OutputTuple, RemovedEvent.OutputObject>;
    getEvent(key: "Upgraded"): TypedContractEvent<UpgradedEvent.InputTuple, UpgradedEvent.OutputTuple, UpgradedEvent.OutputObject>;
    filters: {
        "Added(string,address)": TypedContractEvent<AddedEvent.InputTuple, AddedEvent.OutputTuple, AddedEvent.OutputObject>;
        Added: TypedContractEvent<AddedEvent.InputTuple, AddedEvent.OutputTuple, AddedEvent.OutputObject>;
        "AdminChanged(address,address)": TypedContractEvent<AdminChangedEvent.InputTuple, AdminChangedEvent.OutputTuple, AdminChangedEvent.OutputObject>;
        AdminChanged: TypedContractEvent<AdminChangedEvent.InputTuple, AdminChangedEvent.OutputTuple, AdminChangedEvent.OutputObject>;
        "BeaconUpgraded(address)": TypedContractEvent<BeaconUpgradedEvent.InputTuple, BeaconUpgradedEvent.OutputTuple, BeaconUpgradedEvent.OutputObject>;
        BeaconUpgraded: TypedContractEvent<BeaconUpgradedEvent.InputTuple, BeaconUpgradedEvent.OutputTuple, BeaconUpgradedEvent.OutputObject>;
        "Initialized(uint8)": TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        Initialized: TypedContractEvent<InitializedEvent.InputTuple, InitializedEvent.OutputTuple, InitializedEvent.OutputObject>;
        "Removed(string,address)": TypedContractEvent<RemovedEvent.InputTuple, RemovedEvent.OutputTuple, RemovedEvent.OutputObject>;
        Removed: TypedContractEvent<RemovedEvent.InputTuple, RemovedEvent.OutputTuple, RemovedEvent.OutputObject>;
        "Upgraded(address)": TypedContractEvent<UpgradedEvent.InputTuple, UpgradedEvent.OutputTuple, UpgradedEvent.OutputObject>;
        Upgraded: TypedContractEvent<UpgradedEvent.InputTuple, UpgradedEvent.OutputTuple, UpgradedEvent.OutputObject>;
    };
}
