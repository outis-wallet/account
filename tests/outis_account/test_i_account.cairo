use outis::multiowner_account::{outis_account::OutisAccount::{MAX_ESCAPE_TIP_STRK, TIME_BETWEEN_TWO_ESCAPES}};
use outis::signer::signer_signature::Signer;
use outis::utils::serialization::serialize;
use core::num::traits::Zero;
use crate::{
    OutisAccountSetup, ITestOutisAccountDispatcherTrait, SignerKeyPairImpl, StarknetKeyPair, initialize_account,
};
use snforge_std::{
    generate_random_felt, start_cheat_block_timestamp_global, start_cheat_caller_address_global,
    start_cheat_resource_bounds_global, start_cheat_signature_global, start_cheat_tip_global,
    start_cheat_transaction_hash_global, start_cheat_transaction_version_global,
};
use starknet::{ResourcesBounds, account::Call};

#[test]
#[should_panic(expected: ('outis/invalid-tx-version',))]
fn check_transaction_version_on_execute() {
    let OutisAccountSetup { account, .. } = initialize_account();
    start_cheat_caller_address_global(Zero::zero());
    start_cheat_transaction_version_global(32);
    account.__execute__(array![]);
}

#[test]
#[should_panic(expected: ('outis/invalid-tx-version',))]
fn check_transaction_version_on_validate() {
    let OutisAccountSetup { account, .. } = initialize_account();
    start_cheat_caller_address_global(Zero::zero());
    start_cheat_transaction_version_global(32);
    account.__validate__(array![]);
}

#[test]
#[should_panic(expected: ('outis/non-null-caller',))]
fn cant_call_validate() {
    let OutisAccountSetup { account, .. } = initialize_account();
    start_cheat_caller_address_global(42.try_into().unwrap());
    account.__validate__(array![]);
}

#[test]
#[should_panic(expected: ('outis/tip-too-high',))]
fn test_max_tip() {
    let OutisAccountSetup { account, owners, .. } = initialize_account();
    let owner = owners[0];

    start_cheat_caller_address_global(Zero::zero());
    start_cheat_transaction_version_global(3);

    // We need tip * max_amount > MAX_ESCAPE_TIP_STRK
    start_cheat_tip_global(1);
    let max_amount = MAX_ESCAPE_TIP_STRK.try_into().unwrap() + 1;
    let resource_bounds: Array<ResourcesBounds> = array![
        ResourcesBounds { resource: 'L2_GAS', max_amount, max_price_per_unit: 1 },
    ];
    start_cheat_resource_bounds_global(resource_bounds.span());

    let tx_hash = generate_random_felt();
    let owner_signature = owner.sign(tx_hash);
    start_cheat_transaction_hash_global(tx_hash);
    start_cheat_signature_global(serialize(@owner_signature).span());

    start_cheat_block_timestamp_global(TIME_BETWEEN_TWO_ESCAPES + 1);

    let call = Call {
        selector: selector!("trigger_escape_guardian"),
        to: account.contract_address,
        calldata: serialize(@Option::<Signer>::None).span(),
    };

    account.__validate__(array![call]);
}

#[test]
fn test_max_tip_on_limit() {
    let OutisAccountSetup { account, owners, .. } = initialize_account();
    let owner = owners[0];

    start_cheat_caller_address_global(Zero::zero());
    start_cheat_transaction_version_global(3);

    // We need tip * max_amount <= MAX_ESCAPE_TIP_STRK
    start_cheat_tip_global(1);
    let max_amount = MAX_ESCAPE_TIP_STRK.try_into().unwrap();
    let resource_bounds: Array<ResourcesBounds> = array![
        ResourcesBounds { resource: 'L2_GAS', max_amount, max_price_per_unit: 1 },
    ];
    start_cheat_resource_bounds_global(resource_bounds.span());

    let tx_hash = generate_random_felt();
    let owner_signature = owner.sign(tx_hash);
    start_cheat_transaction_hash_global(tx_hash);
    start_cheat_signature_global(serialize(@array![owner_signature]).span());

    start_cheat_block_timestamp_global(TIME_BETWEEN_TWO_ESCAPES + 1);

    let call = Call {
        selector: selector!("trigger_escape_guardian"),
        to: account.contract_address,
        calldata: serialize(@Option::<Signer>::None).span(),
    };

    account.__validate__(array![call]);
}
