use crate::{
    OutisAccountSetup, ITestOutisAccountDispatcherTrait, SignerKeyPairImpl, StarknetKeyPair, initialize_account,
};
use snforge_std::{start_cheat_caller_address_global};

#[test]
fn test_revoke_session() {
    let OutisAccountSetup { account, .. } = initialize_account();
    assert!(!account.is_session_revoked(42));
    account.revoke_session(42);
    assert!(account.is_session_revoked(42));
}

#[test]
#[should_panic(expected: ('session/already-revoked',))]
fn test_revoke_session_already_revoked() {
    let OutisAccountSetup { account, .. } = initialize_account();
    assert!(!account.is_session_revoked(42));
    account.revoke_session(42);
    account.revoke_session(42);
}

#[test]
#[should_panic(expected: ('outis/only-self',))]
fn test_revoke_session_only_self() {
    let OutisAccountSetup { account, .. } = initialize_account();
    start_cheat_caller_address_global(42.try_into().unwrap());
    account.revoke_session(42);
}

