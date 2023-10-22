import { type } from "os";
import { SmartContract, state, State, method, Reducer, PublicKey, UInt64 } from "snarkyjs";
import { Field, Bool, Struct, Circuit, CircuitString } from "snarkyjs";
import { MerkleMapWitness } from "snarkyjs";


class CredentialSettings extends Struct({
  issuerId: PublicKey,
  ownerId: PublicKey,
  claimId: PublicKey,
  tokenId: Field, // the Claim type is a Custom Token !
  balance: UInt64, // can in the future use an ammount with a credential ?
  issuedUTC: Field,
  expiresUTC: Field, // Zero if no expiration data
  isRevocable: Bool,
  isTransferable: Bool,
  contentURI: String // will be copied to 'account.zkappUri'
}) {}

class CredentialProperties extends Struct({
  issuedUTC: UInt64,
  expiresUTC: UInt64,
  isRevocable: Bool,
  isTransferable: Bool,
  isValid: Bool,
}) {}

const ISSUED = 1, REVOKED = 2, TRANSFERED = 3; 

class CredentialAction extends Struct({
  type: UInt64, // ISSUED, REVOKED, TRANSFERED
  actionUTC: Field, // when was it done
  //reason: CircuitString, // why it was done
  senderId: PublicKey, // who called this action (owner or issuer)
  // status after the action 
  isValid: Bool,
  isExpired: Bool,
  isRevoked: Bool,
  isTransfered: Bool
}) {}


export class CredentialContract extends SmartContract {

  // the associated Claim account containing the voting results
  @state(PublicKey) claimId = State<PublicKey>(); 

  // the Owner account of this credential
  @state(PublicKey) ownerId = State<PublicKey>(); 

  // the Community account which issued this credential
  @state(PublicKey) issuerId = State<PublicKey>(); 

  // packed CredentialProperties fields 
  @state(Field) properties = State<Field>(); 

  init() {
    super.init();
  }

  ownerOnly(sender: PublicKey) {
    let ownerId = this.ownerId.getAndAssertEquals()
    ownerId.assertEquals(sender);
  }

  issuerOnly(sender: PublicKey) {
    let issuerId = this.issuerId.getAndAssertEquals()
    issuerId.assertEquals(sender);
  }

  /**
   * Issues the credential, setting its issuer and owner, its properties (dates, 
   * tokeinId, balance, revocation status, type, metadata permanent IPFS URI) 
   * and binding it to the original Claim and voting process which approved it. 
   * It also changes the permissions so that only the issuer can revoke it,
   * and the owner can not be changed, so it remains soul-bounded to the owner.
   * Dispatchs action type=ISSUED.
   */
  @method issueIt(setup: CredentialSettings) {
    //
  }


  /**
   * Revokes this credential, setting the isValid value to False. It is forceful
   * revocation, so that it will be invalidated even if it has not yet expired. 
   * This can only be done by the issuer.
   * Dispatchs action type=REVOKED.
   */
  @method revokeIt(reason: CircuitString) {
    // this.issuerOnly(this.sender);
  }


  /**
   * Transfers ownership of this credential to a different account, but only
   * if the credential can be transfered. Only the current owner can do it.
   * Dispatchs action type=TRANSFERED.
   */
  @method transferIt(newOwner: PublicKey, reason: CircuitString) {
    // this.ownerOnly(this.sender);
    // this.isTransferable
  }


  /**
   * Checks if the credential has already expired, using the expiresUTC and the
   * current timestamp. The credential could have been revoked for some 
   * reason, so validity does not only depend on the expiration date.
   */
  isValidNow(): Bool {
    //
  }


  /**
   * Checks if the credential was valid at a previous date, using the expiresUTC
   * and the isValid property. The credential could have been revoked for some 
   * reason, so validity does not only depend on the expiration date.
   * @param ts timestamp in millisecs since UTC 1970-01-01T00:00:00.000Z 
   */
  wasValidAt(ts: Field): Bool {
    //
  }


  /**
   * Check if this credential can be revoked. Only credentials where the 
   * 'isRevocable' property is true can be revoked.
   */
  isRevocable(): Bool {
    // 
  }

  
  /**
   * Check if this credential can be transfered to other owner. If it is 
   * allowed only the current owner can transfer it to some other account.
   */
  isTransferable(): Bool {
    // 
  }


  /**
   * Returns all credential info, using the packed properties, and the
   * current status for this credential.
   */
  getProperties(): CredentialProperties {
    //
  }


  /**
   * Returns all actions which have been dispatched (and attached) to this 
   * credential. It is asumed that actions will be returned in the order in
   * which they have been processed, and since usually the time between actions 
   * will be quite long (months usually) we can have confidence that they will 
   * be processed in the same order in which they were executed. 
   */
  getActions(): CredentialAction[] {
    //
  }
}