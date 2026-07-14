// src/components/admin/AccountHistoryModal.tsx
import { useEffect, useState } from 'react';
import Modal from '../../common/Modal';
import Spinner from '../../common/Spinner';
import ErrorMessage from '../../common/ErrorMessage';
import JsonViewer from '../../common/JsonViewer';
import Badge from '../../common/Badge';
import adminService from '../../../services/admin.service';
import type { AccountHistory, AdminUser } from '../../../types/admin.types';

interface Props {
    user: AdminUser;
    onClose: () => void;
}

const CHANGE_TYPE_CONFIG: Record<
    AccountHistory['change_type'],
    { label: string; variant: 'blue' | 'orange' | 'gray' | 'red' }
> = {
    EMAIL_CHANGED: { label: 'Email Changed', variant: 'blue' },
    STATUS_CHANGED: { label: 'Status Changed', variant: 'orange' },
    BALANCE_SNAPSHOT: { label: 'Balance Snapshot', variant: 'gray' },
    ACCOUNT_DELETED: { label: 'Account Deleted', variant: 'red' },
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function AccountHistoryModal({ user, onClose }: Props) {
    const [history, setHistory] = useState<AccountHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getAccountHistory(user.account?.account_id || '');
            setHistory(data);
        } catch {
            setError('Failed to load change history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, [user.account?.account_id]);

    return (
        <Modal
            open
            title={`History changes — ${user.full_name}`}
            onClose={onClose}
            width="max-w-2xl"
        >
            {loading && <Spinner />}
            {!loading && error && <ErrorMessage message={error} onRetry={fetchHistory} />}
            {!loading && !error && (
                <div className="max-h-[60vh] overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center py-10 gap-2">
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm text-gray-400">No change history available.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {history.map((item) => {
                                const cfg = CHANGE_TYPE_CONFIG[item.change_type];
                                return (
                                    <div key={item.id}
                                        className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">

                                        {/* Timeline dot */}
                                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />

                                        <div className="flex-1 min-w-0">
                                            {/* Header row */}
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <Badge label={cfg.label} variant={cfg.variant} />
                                                <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                                            </div>

                                            {/* Changed by */}
                                            {item.changed_by && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Changed by: <span className="font-mono">{item.changed_by}</span>
                                                </p>
                                            )}

                                            {/* Before / After */}
                                            <div className="flex items-start gap-3 mt-2">
                                                <JsonViewer data={item.before_data} label="before" variant="before" />
                                                <span className="text-gray-300 mt-0.5">→</span>
                                                <JsonViewer data={item.after_data} label="after" variant="after" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}