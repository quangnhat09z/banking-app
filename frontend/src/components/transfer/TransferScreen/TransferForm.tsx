

import InputField from '../../common/InputField';
import Button from '../../common/Button';

interface FormState {
    to_account_number: string;
    amount: string;
    description: string;
}

interface FormErrors {
    to_account_number?: string;
    amount?: string;
    general?: string;
}

interface TransferFormProps {
    form: FormState;
    errors: FormErrors;
    onChange: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => void;
    onReview: () => void;
    formatVND: (value: string | number) => string;
}

export default function TransferForm({ form, errors, onChange, onReview, formatVND }: TransferFormProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col gap-5 animate-fade-in">
            {errors.general && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                    </svg>
                    <span className="font-medium">{errors.general}</span>
                </div>
            )}

            <InputField
                label="Recipient Account Number"
                placeholder="Enter 9–12 digit destination account"
                value={form.to_account_number}
                onChange={onChange('to_account_number')}
                error={errors.to_account_number}
            />

            <div className="relative">
                <InputField
                    label="Transfer Amount (VND)"
                    placeholder="e.g., 500000"
                    value={form.amount}
                    onChange={onChange('amount')}
                    error={errors.amount}
                />
                {/* Preview định dạng tiền tệ sống động */}
                {form.amount && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0 && (
                    <div className="absolute top-0 right-0 h-6 flex items-center">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md animate-fade-in">
                            {formatVND(form.amount)}
                        </span>
                    </div>
                )}
            </div>

            <InputField
                label="Transfer Description (Optional)"
                placeholder="Enter transfer message"
                value={form.description}
                onChange={onChange('description')}
            />

            <Button fullWidth onClick={onReview}>
                Continue to Confirmation
            </Button>
        </div>
    )
}

