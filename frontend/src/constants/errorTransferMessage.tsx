// src/constants/errorTransferMessage.ts
export const TRANSFER_ERROR_MAP: Record<string, string> = {
    'Insufficient balance for the transfer': 'Your account balance is insufficient for this transfer',
    'Target account not found': 'Target account not found, please check the account number again',
    'Target account is not active': 'Target account is not active, please check the account number again',
    'Sender account not found': 'Your account was not found, please contact support',
    'Sender account is not active': 'Your account is not active, please contact support',
    'Cannot transfer to the same account': 'You cannot transfer to your own account',
    'Amount is invalid': 'The transfer amount is invalid',
    'Amount exceeds the maximum limit of 999999999999.99': 'The transfer amount exceeds the allowed limit',
};

export const DEFAULT_TRANSFER_ERROR = 'An error occurred while processing the transaction. Please try again later.';