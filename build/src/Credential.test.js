import { Credential } from './Credential.js';
import { Field, Mina, PrivateKey, AccountUpdate } from 'snarkyjs';
/*
 * This file specifies how to test the `Credential` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */
let proofsEnabled = false;
describe('Credential', () => {
    let deployerAccount, deployerKey, senderAccount, senderKey, zkAppAddress, zkAppPrivateKey, zkApp;
    beforeAll(async () => {
        if (proofsEnabled)
            await Credential.compile();
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
        // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
        await txn.sign([deployerKey, zkAppPrivateKey]).send();
    }
    it('generates and deploys the `Credential` smart contract', async () => {
        await localDeploy();
        const num = zkApp.num.get();
        expect(num).toEqual(Field(1));
    });
    it('correctly updates the num state on the `Credential` smart contract', async () => {
        await localDeploy();
        // update transaction
        const txn = await Mina.transaction(senderAccount, () => {
            zkApp.update();
        });
        await txn.prove();
        await txn.sign([senderKey]).send();
        const updatedNum = zkApp.num.get();
        expect(updatedNum).toEqual(Field(3));
    });
});
//# sourceMappingURL=Credential.test.js.map