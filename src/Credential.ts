import { stat } from 'fs';
import {
  Field,
  SmartContract,
  state,
  State,
  method,
  CircuitString,
  PublicKey,
  Struct,
  UInt64,
  Bool,
  Circuit,
  Reducer,
  prop
} from 'snarkyjs';


const 
  ISSUED = UInt64.from(1), 
  REVOKED = UInt64.from(2), 
  TRANSFERED = UInt64.from(3); 
 
class CredentialProperties extends Struct({
  issuerId: PublicKey,
  ownerId: PublicKey,
  originId: PublicKey,
  tokenId: Field, // the Claim type is a Custom Token !
  balance: UInt64, // can in the future use an ammount with a credential ?
  issuedUTC: UInt64,
  expiresUTC: UInt64, // Zero if no expiration data
  isRevocable: Bool,
  isTransferable: Bool,
  metadataURI: String // will be copied to 'account.zkappUri'
}) {}

/**
 * Because of limits in the number of state vars we can have in an account we 
 * use actions to store additional state. This state can be retrieved using the
 * Reducer.getActions() and the lastActionState field, as well as the history 
 * of all actions performed on this credential.
 */
class CredentialAction extends Struct({
  // the action info
  type: UInt64,           // ISSUED, REVOKED, TRANSFERED
  actionUTC: UInt64,       // when was it done (UTC tiemstamp)
  senderId: PublicKey,    // who called this action (owner or issuer)

  // state after the ISSUED action, it is setup when the credential is issued
  // and it is never changed again by any other action
  originId: PublicKey,    // the Claim account containing the voting results
  issuedUTC: UInt64,      // issued date (UTC timestamp)
  expiresUTC: UInt64,     // expiration date (UTC timestamp), or zero if no expiration
  isRevocable: Bool,      // is this credential revocable by the issuer ?
  isTransferable: Bool,   // can this credential be transfered by its owner ?
  
  // state after all actions, calculated at the time the action was dispatched
  hasExpired: Bool,       // had expired when the action was dispatched ?
  wasRevoked: Bool,       // was revoked by this or a previous action ?
  wasTransfered: Bool,     // was transfered by this or a previous action ?
  
  // state after the TRANSFERED action, does not change until a new transfer
  whoTransferedId: PublicKey // the previous owner Id who transfered it
}) {}


/**
 */
export class Credential extends SmartContract {

  // the "reducer" field describes a type of action that we can dispatch, and reduce later
  reducer = Reducer({ actionType: CredentialAction });

  // helper field to store the actual point in the actions history
  @state(Field) lastActionState = State<Field>(); 
 
  // the Owner account of this credential
  @state(PublicKey) ownerId = State<PublicKey>(); 
  
  // the Community account which issued this credential
  @state(PublicKey) issuerId = State<PublicKey>(); 

  @state(Field) num = State<Field>();
 
  init() {
    super.init();
    this.ownerId.set(PublicKey.empty());
    this.issuerId.set(PublicKey.empty());
    this.lastActionState.set(Reducer.initialActionState);
    //
    this.num.set(Field(1));
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
  @method issueIt(props: CredentialProperties) {
    let issuerId = this.issuerId.getAndAssertEquals();
    let ownerId = this.ownerId.getAndAssertEquals();

    // can only issue if has not been issued before
    issuerId.assertEquals(PublicKey.empty());
    ownerId.assertEquals(PublicKey.empty());

    // change permissions so it can not be changed

    // NOTE: the issuer is NOT the sender, because the method will be called
    // by the Socialcap payer account and not by the Community admin, so that
    // issuing the credential can be automated and dispatched as soon as the 
    // voting process is finished and the credential is approved
    this.issuerId.set(props.issuerId);

    // owner of the credential is the account who claimed and payed for it
    this.ownerId.set(props.ownerId);

    // the first action is always ISSUED
    let nowUTC = props.issuedUTC; 
    const action: CredentialAction = { 
      type: ISSUED,
      actionUTC: nowUTC,
      senderId: this.sender,
      // state after ISSUED
      originId: props.originId,
      issuedUTC: nowUTC,  
      expiresUTC: props.expiresUTC,
      isRevocable: props.isRevocable, 
      isTransferable: props.isTransferable,   
      hasExpired: Bool(false),   
      wasRevoked: Bool(false),   
      wasTransfered: Bool(false),
      whoTransferedId: PublicKey.empty()
    };
    this.reducer.dispatch(action);  
  }
}
