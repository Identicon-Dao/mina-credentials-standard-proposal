import { Credential } from './Credential.js';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, UInt64, Bool } from 'snarkyjs';

/*
 * This file specifies how to test the `Credential` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = true;

describe('Credential', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Credential;

  beforeAll(async () => {
    if (proofsEnabled) await Credential.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Credential(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that 
    // requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `Credential` smart contract', async () => {
    await localDeploy();
    const ownerId = zkApp.ownerId.get();
    const issuerId = zkApp.issuerId.get();
    expect(ownerId).toEqual(PublicKey.empty());
    expect(issuerId).toEqual(PublicKey.empty());
  });

  it('correctly issues the `Credential` from `issuer` to `owner`', async () => {
    await localDeploy();

    const TESTADDR = "B62qpH9Z7wA4FWYEbhf48PNhjKgeYhboVmBZNKd1tLSkFuZUoEiqYAm";

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.issueIt({
        issuerId: PublicKey.fromBase58(TESTADDR),
        ownerId: PublicKey.fromBase58(TESTADDR),
        originId: PublicKey.fromBase58(TESTADDR),
        tokenId: Field(0), 
        balance: UInt64.from(0), 
        issuedUTC: UInt64.from(0),
        expiresUTC: UInt64.from(0), 
        isRevocable: Bool(false),
        isTransferable: Bool(false),
        metadataURI: String("")        
      });
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const ownerId = zkApp.ownerId.get();
    const issuerId = zkApp.issuerId.get();
    expect(ownerId).toEqual(PublicKey.fromBase58(TESTADDR));
    expect(issuerId).toEqual(PublicKey.fromBase58(TESTADDR));
  });
});
