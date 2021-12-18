/* @flow */

import { ERRORS } from '../../../constants';
import { validateParams } from './paramsValidator';
import type {
    BinanceSDKTransaction,
    BinancePreparedMessage,
    BinancePreparedTransaction,
} from '../../../types/networks/binance';
import type { TypedCall } from '../../../types/trezor/protobuf';

const processTxRequest = async (
    typedCall: TypedCall,
    messages: BinancePreparedMessage[],
    index: number,
) => {
    const { type, ...params } = messages[index];
    const lastOp = index + 1 >= messages.length;

    if (lastOp) {
        // $FlowIssue type and params are unions. TODO: make exact BinancePreparedMessage
        const response = await typedCall(type, 'BinanceSignedTx', params);
        return response.message;
    }
    // $FlowIssue type and params are unions. TODO: make exact BinancePreparedMessage
    await typedCall(type, 'BinanceTxRequest', params);
    index++;

    return processTxRequest(typedCall, messages, index);
};

// validate and translate params to protobuf
export const validate = (tx: BinanceSDKTransaction) => {
    validateParams(tx, [
        { name: 'chain_id', type: 'string', obligatory: true },
        { name: 'account_number', type: 'number' },
        { name: 'memo', type: 'string' },
        { name: 'sequence', type: 'number' },
        { name: 'source', type: 'number' },
        { name: 'message', type: 'object' },
    ]);

    const preparedTx: BinancePreparedTransaction = {
        chain_id: tx.chain_id,
        account_number: tx.account_number || 0,
        memo: tx.memo,
        sequence: tx.sequence || 0,
        source: tx.source || 0,
        messages: [],
    };

    const { transfer, placeOrder, cancelOrder } = tx;

    if (transfer) {
        validateParams(transfer, [
            { name: 'inputs', type: 'array', obligatory: true },
            { name: 'outputs', type: 'array', obligatory: true },
        ]);
        preparedTx.messages.push({
            ...transfer,
            type: 'BinanceTransferMsg',
        });
    }

    if (placeOrder) {
        validateParams(placeOrder, [
            { name: 'id', type: 'string' },
            { name: 'ordertype', type: 'number' },
            { name: 'price', type: 'number' },
            { name: 'quantity', type: 'number' },
            { name: 'sender', type: 'string' },
            { name: 'side', type: 'number' },
        ]);
        preparedTx.messages.push({
            ...placeOrder,
            type: 'BinanceOrderMsg',
        });
    }

    if (cancelOrder) {
        validateParams(cancelOrder, [
            { name: 'refid', type: 'string', obligatory: true },
            { name: 'sender', type: 'string', obligatory: true },
            { name: 'symbol', type: 'string', obligatory: true },
        ]);
        preparedTx.messages.push({
            ...cancelOrder,
            type: 'BinanceCancelMsg',
        });
    }

    if (preparedTx.messages.length < 1) {
        throw ERRORS.TypedError('Method_InvalidParameter', 'Transaction does not have any message');
    }

    return preparedTx;
};

export const signTx = async (
    typedCall: TypedCall,
    address_n: number[],
    tx: BinancePreparedTransaction,
) => {
    const { account_number, chain_id, memo, sequence, source, messages } = tx;
    const msg_count = messages.length;

    await typedCall('BinanceSignTx', 'BinanceTxRequest', {
        address_n,
        msg_count,
        account_number,
        chain_id,
        memo,
        sequence,
        source,
    });
    return processTxRequest(typedCall, messages, 0);
};
