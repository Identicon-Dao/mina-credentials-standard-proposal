import { SmartContract, State, CircuitString } from 'snarkyjs';
/**
 * Basic Example
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * The Credential contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
 * When the 'update' method is called, the Credential contract adds Field(2) to its 'num' contract state.
 *
 * This file is safe to delete and replace with your own contract.
 */
export declare class Credential extends SmartContract {
    num: State<import("snarkyjs/dist/node/lib/field").Field>;
    originAddr: State<CircuitString>;
    init(): void;
    update(): void;
}
