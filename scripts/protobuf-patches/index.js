const fs = require('fs');

const UINT_TYPE = 'UintType';

// type rule fixes, ideally it should not be here
const RULE_PATCH = {
    'MultisigRedeemScriptType.nodes': 'optional', // its valid to be undefined according to implementation/tests
    'MultisigRedeemScriptType.address_n': 'optional', // its valid to be undefined according to implementation/tests
    'TxRequestDetailsType.request_index': 'required',
    'TxRequest.request_type': 'required',
    'TxRequest.details': 'required',
    'CardanoPoolOwnerType.staking_key_path': 'optional',
    'CardanoPoolOwner.staking_key_path': 'optional',
    'CardanoTxCertificateType.path': 'optional',
    'CardanoTxCertificate.path': 'optional',
    'CardanoTxInputType.address_n': 'optional',
    'CardanoTxWithdrawal.path': 'optional',
    'CardanoNativeScript.scripts': 'optional',
    'CardanoNativeScript.key_path': 'optional',
    'Success.message': 'required', // didn't find use case where it's not sent
    'SignedIdentity.address': 'required',
    'EosAuthorizationKey.key': 'required', // its valid to be undefined according to implementation/tests
    'EosAuthorizationKey.type': 'optional', // its valid to be undefined according to implementation/tests
    'EosAuthorizationKey.address_n': 'optional', // its valid to be undefined according to implementation/tests
    'EthereumAddress.address': 'required', // address is transformed from legacy type _old_address
    // TODO: Features should be union: bootloader|normal
    // fields below are marked as required because of backward compatibility (suite implementation)
    'Features.vendor': 'required',
    'Features.bootloader_mode': 'required',
    'Features.device_id': 'required',
    'Features.major_version': 'required',
    'Features.minor_version': 'required',
    'Features.patch_version': 'required',
    'Features.pin_protection': 'required',
    'Features.passphrase_protection': 'required',
    'Features.language': 'required',
    'Features.label': 'required',
    'Features.initialized': 'required',
    'Features.revision': 'required',
    'Features.bootloader_hash': 'required',
    'Features.imported': 'required',
    'Features.unlocked': 'required',
    'Features.firmware_present': 'required',
    'Features.needs_backup': 'required',
    'Features.flags': 'required',
    'Features.fw_major': 'required',
    'Features.fw_minor': 'required',
    'Features.fw_patch': 'required',
    'Features.fw_vendor': 'required',
    'Features.model': 'required',
    'Features.fw_vendor_keys': 'required',
    'Features.unfinished_backup': 'required',
    'Features.no_backup': 'required',
    'Features.recovery_mode': 'required',
    'Features.backup_type': 'required',
    'Features.sd_card_present': 'required',
    'Features.sd_protection': 'required',
    'Features.wipe_code_protection': 'required',
    'Features.session_id': 'required',
    'Features.passphrase_always_on_device': 'required',
    'Features.safety_checks': 'required',
    'Features.auto_lock_delay_ms': 'required',
    'Features.display_rotation': 'required',
    'Features.experimental_features': 'required',
    'NEMTransactionCommon.address_n': 'optional', // no address_n in multisig
    'NEMTransfer.mosaics': 'optional', // its valid to be undefined according to implementation/tests
    'NEMMosaicDefinition.networks': 'optional', // never used according to implementation/tests
    'NEMAggregateModification.modifications': 'optional', // its valid to be undefined according to implementation/tests
    'StellarAssetType.code': 'required',
    'StellarPathPaymentStrictReceiveOp.paths': 'optional', // its valid to be undefined according to implementation/tests
    'StellarPathPaymentStrictSendOp.paths': 'optional', // its valid to be undefined according to implementation/tests
};

// custom types IN to trezor
// protobuf lib will handle the translation to required type
// connect or other 3rd party libs are using compatible types (string as number etc...)
const TYPE_PATCH = {
    'Features.bootloader_mode': 'boolean | null',
    'Features.device_id': 'string | null',
    'Features.pin_protection': 'boolean | null',
    'Features.passphrase_protection': 'boolean | null',
    'Features.language': 'string | null',
    'Features.label': 'string | null',
    'Features.initialized': 'boolean | null',
    'Features.revision': 'string | null',
    'Features.bootloader_hash': 'string | null',
    'Features.imported': 'boolean | null',
    'Features.unlocked': 'boolean | null',
    'Features.firmware_present': 'boolean | null',
    'Features.needs_backup': 'boolean | null',
    'Features.flags': 'number | null',
    'Features.fw_major': 'number | null',
    'Features.fw_minor': 'number | null',
    'Features.fw_patch': 'number | null',
    'Features.fw_vendor': 'string | null',
    'Features.fw_vendor_keys': 'string | null',
    'Features.unfinished_backup': 'boolean | null',
    'Features.no_backup': 'boolean | null',
    'Features.recovery_mode': 'boolean | null',
    'Features.backup_type': 'BackupType | null',
    'Features.sd_card_present': 'boolean | null',
    'Features.sd_protection': 'boolean | null',
    'Features.wipe_code_protection': 'boolean | null',
    'Features.session_id': 'string | null',
    'Features.passphrase_always_on_device': 'boolean | null',
    'Features.safety_checks': 'SafetyCheckLevel | null',
    'Features.auto_lock_delay_ms': 'number | null',
    'Features.display_rotation': 'number | null',
    'Features.experimental_features': 'boolean | null',
    'HDNodePathType.node': 'HDNodeType | string',
    'FirmwareUpload.payload': 'Buffer',
    'CardanoCatalystRegistrationParametersType.nonce': UINT_TYPE,
    'CardanoPoolParametersType.pledge': UINT_TYPE,
    'CardanoPoolParametersType.cost': UINT_TYPE,
    'CardanoPoolParametersType.margin_numerator': UINT_TYPE,
    'CardanoPoolParametersType.margin_denominator': UINT_TYPE,
    'CardanoSignTx.ttl': UINT_TYPE,
    'CardanoSignTx.validity_interval_start': UINT_TYPE,
    'CardanoSignTxInit.ttl': UINT_TYPE,
    'CardanoSignTxInit.validity_interval_start': UINT_TYPE,
    'CardanoToken.mint_amount': UINT_TYPE,
    'CardanoNativeScript.invalid_before': UINT_TYPE,
    'CardanoNativeScript.invalid_hereafter': UINT_TYPE,
    'EosAsset.symbol': 'string',
    'EosPermissionLevel.actor': 'string',
    'EosPermissionLevel.permission': 'string',
    'EosAuthorizationKey.key': 'string',
    'EosActionCommon.account': 'string',
    'EosActionCommon.name': 'string',
    'EosActionTransfer.sender': 'string',
    'EosActionTransfer.receiver': 'string',
    'EosActionDelegate.sender': 'string',
    'EosActionDelegate.receiver': 'string',
    'EosActionUndelegate.sender': 'string',
    'EosActionUndelegate.receiver': 'string',
    'EosActionRefund.owner': 'string',
    'EosActionBuyRam.payer': 'string',
    'EosActionBuyRam.receiver': 'string',
    'EosActionBuyRamBytes.payer': 'string',
    'EosActionBuyRamBytes.receiver': 'string',
    'EosActionSellRam.account': 'string',
    'EosActionVoteProducer.voter': 'string',
    'EosActionVoteProducer.proxy': 'string',
    'EosActionVoteProducer.producers': 'string',
    'EosActionUpdateAuth.account': 'string',
    'EosActionUpdateAuth.permission': 'string',
    'EosActionUpdateAuth.parent': 'string',
    'EosActionDeleteAuth.account': 'string',
    'EosActionDeleteAuth.permission': 'string',
    'EosActionLinkAuth.account': 'string',
    'EosActionLinkAuth.code': 'string',
    'EosActionLinkAuth.type': 'string',
    'EosActionLinkAuth.requirement': 'string',
    'EosActionUnlinkAuth.account': 'string',
    'EosActionUnlinkAuth.code': 'string',
    'EosActionUnlinkAuth.type': 'string',
    'EosActionNewAccount.creator': 'string',
    'EosActionNewAccount.name': 'string',
    'ResetDevice.backup_type': 'string | number', // BackupType is a enum. in Features displayed as string, in resetDevice method param accepted as number
    'StellarAssetType.type': '0 | 1 | 2',
    'StellarSignTx.sequence_number': UINT_TYPE,
    'StellarSignTx.memo_id': 'string',
    'StellarSignTx.memo_hash': 'Buffer | string',
    'StellarCreateAccountOp.starting_balance': UINT_TYPE,
    'StellarPathPaymentStrictReceiveOp.send_max': UINT_TYPE,
    'StellarPathPaymentStrictReceiveOp.destination_amount': UINT_TYPE,
    'StellarPathPaymentStrictSendOp.send_amount': UINT_TYPE,
    'StellarPathPaymentStrictSendOp.destination_min': UINT_TYPE,
    'StellarManageSellOfferOp.offer_id': UINT_TYPE,
    'StellarManageBuyOfferOp.offer_id': UINT_TYPE,
    'StellarSetOptionsOp.master_weight': UINT_TYPE,
    'StellarSetOptionsOp.low_threshold': UINT_TYPE,
    'StellarSetOptionsOp.medium_threshold': UINT_TYPE,
    'StellarSetOptionsOp.high_threshold': UINT_TYPE,
    'StellarSetOptionsOp.signer_key': 'Buffer | string',
    'StellarChangeTrustOp.limit': UINT_TYPE,
    'StellarManageDataOp.value': 'Buffer | string',
    'StellarBumpSequenceOp.bump_to': UINT_TYPE,
    'TezosContractID.tag': 'number',
    'TezosContractID.hash': 'Uint8Array',
    'TezosRevealOp.source': 'Uint8Array',
    'TezosRevealOp.public_key': 'Uint8Array',
    'TezosParametersManager.set_delegate': 'Uint8Array',
    'TezosTransactionOp.source': 'Uint8Array',
    'TezosTransactionOp.parameters': 'number[]',
    'TezosOriginationOp.source': 'Uint8Array',
    'TezosOriginationOp.delegate': 'Uint8Array',
    'TezosOriginationOp.script': 'string | number[]',
    'TezosDelegationOp.source': 'Uint8Array',
    'TezosDelegationOp.delegate': 'Uint8Array',
    'TezosSignTx.branch': 'Uint8Array',
};

const DEFINITION_PATCH = {
    TxInputType: fs.readFileSync('./scripts/protobuf-patches/TxInputType.js', 'utf8'),
    TxOutputType: fs.readFileSync('./scripts/protobuf-patches/TxOutputType.js', 'utf8'),
    TxAck: fs.readFileSync('./scripts/protobuf-patches/TxAck.js', 'utf8'),
};

// skip unnecessary types
const SKIP = [
    'MessageType', // connect uses custom definition
    'TransactionType', // connect uses custom definition
    'TxInput', // declared in TxInputType patch
    'TxOutput', // declared in TxOutputType patch
    // not implemented
    'CosiCommit',
    'CosiCommitment',
    'CosiSign',
    'CosiSignature',
    'DebugSwipeDirection',
    'DebugLinkDecision',
    'DebugLinkLayout',
    'DebugLinkReseedRandom',
    'DebugLinkRecordScreen',
    'DebugLinkGetState',
    'DebugLinkState',
    'DebugLinkStop',
    'DebugLinkLog',
    'DebugLinkMemoryRead',
    'DebugLinkMemory',
    'DebugLinkMemoryWrite',
    'DebugLinkFlashErase',
    'DebugLinkEraseSdCard',
    'DebugLinkWatchLayout',
    'MoneroRctKeyPublic',
    'MoneroOutputEntry',
    'MoneroMultisigKLRki',
    'MoneroTransactionSourceEntry',
    'MoneroAccountPublicAddress',
    'MoneroTransactionDestinationEntry',
    'MoneroTransactionRsigData',
    'MoneroGetAddress',
    'MoneroAddress',
    'MoneroGetWatchKey',
    'MoneroWatchKey',
    'MoneroTransactionData',
    'MoneroTransactionInitRequest',
    'MoneroTransactionInitAck',
    'MoneroTransactionSetInputRequest',
    'MoneroTransactionSetInputAck',
    'MoneroTransactionInputsPermutationRequest',
    'MoneroTransactionInputsPermutationAck',
    'MoneroTransactionInputViniRequest',
    'MoneroTransactionInputViniAck',
    'MoneroTransactionAllInputsSetRequest',
    'MoneroTransactionAllInputsSetAck',
    'MoneroTransactionSetOutputRequest',
    'MoneroTransactionSetOutputAck',
    'MoneroTransactionAllOutSetRequest',
    'MoneroRingCtSig',
    'MoneroTransactionAllOutSetAck',
    'MoneroTransactionSignInputRequest',
    'MoneroTransactionSignInputAck',
    'MoneroTransactionFinalRequest',
    'MoneroTransactionFinalAck',
    'MoneroSubAddressIndicesList',
    'MoneroKeyImageExportInitRequest',
    'MoneroKeyImageExportInitAck',
    'MoneroTransferDetails',
    'MoneroKeyImageSyncStepRequest',
    'MoneroExportedKeyImage',
    'MoneroKeyImageSyncStepAck',
    'MoneroKeyImageSyncFinalRequest',
    'MoneroKeyImageSyncFinalAck',
    'MoneroGetTxKeyRequest',
    'MoneroGetTxKeyAck',
    'MoneroLiveRefreshStartRequest',
    'MoneroLiveRefreshStartAck',
    'MoneroLiveRefreshStepRequest',
    'MoneroLiveRefreshStepAck',
    'MoneroLiveRefreshFinalRequest',
    'MoneroLiveRefreshFinalAck',
    'DebugMoneroDiagRequest',
    'DebugMoneroDiagAck',
    'WebAuthnListResidentCredentials',
    'WebAuthnAddResidentCredential',
    'WebAuthnRemoveResidentCredential',
    'WebAuthnCredential',
    'WebAuthnCredentials',
    'wire_in',
    'wire_out',
    'wire_debug_in',
    'wire_debug_out',
    'wire_tiny',
    'wire_bootloader',
    'wire_no_fsm',
    'bitcoin_only',
    'has_bitcoin_only_values',
    'unstable',
    'wire_type',
    'experimental',
    'include_in_bitcoin_only',
];

module.exports = {
    RULE_PATCH,
    TYPE_PATCH,
    DEFINITION_PATCH,
    SKIP,
    UINT_TYPE,
};
