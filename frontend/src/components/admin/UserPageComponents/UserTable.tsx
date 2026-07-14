import type { AdminUser} from '../../../types/admin.types';


interface UserTableProps {
    users: AdminUser[];
    loading: boolean;
    setEditEmailUser: (user: AdminUser) => void;
    setDeleteModal: (user: AdminUser) => void;
    setHistoryUser: (user: AdminUser) => void;
    formatVND: (amount: string) => string;
    formatDate: (dateStr: string) => string;
    openModal: (user: AdminUser) => void;
}

export default function UserTable({ users, setEditEmailUser, setDeleteModal, setHistoryUser, formatVND, formatDate, openModal }: UserTableProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[950px]">

                    {/* Table header */}
                    <div className="grid grid-cols-[20%_14%_14%_14%_31%] gap-4 px-6 py-3.5
                    bg-slate-50/70 border-b border-slate-200/60 text-[11px] font-bold
                    text-slate-400 uppercase tracking-wider">
                        <span className="text-left">Users Info</span>
                        <span className="text-center">Bank Account</span>
                        <span className="text-center">Role</span>
                        <span className="text-center">Created Date</span>
                        <span className="text-center pr-4">Actions</span>
                    </div>

                    {/* Rows Container */}
                    <div className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="grid grid-cols-[20%_14%_14%_14%_31%] gap-4
                          items-center px-6 py-3.5 hover:bg-slate-50/40 transition-colors"
                            >
                                {/* 1. Name + email + status (Căn trái) */}
                                <div className="min-w-0 text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs font-bold text-slate-800 truncate">
                                            {user.full_name}
                                        </p>
                                        <span className={`shrink-0 inline-flex items-center gap-1
                              text-[10px] font-bold px-2 py-0.5 rounded-full
                              ${user.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/40'
                                                : 'bg-rose-50 text-rose-600 border border-rose-200/40'
                                            }`}>
                                            <span className={`w-1 h-1 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            {user.status === 'active' ? 'Active' : 'Locked'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{user.email}</p>
                                </div>

                                {/* 2. Tài khoản ngân hàng (Căn trái để thẳng hàng với tiêu đề) */}
                                <div className="min-w-0 text-center">
                                    {user.account ? (
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-mono font-bold text-slate-700 tracking-tight">
                                                {user.account.account_number}
                                            </p>
                                            <p className="text-[11px] font-semibold text-slate-500">
                                                {formatVND(user.account.balance)}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-300 italic font-medium">No account connected</p>
                                    )}
                                </div>

                                {/* 3. Role (Căn giữa - Badge sẽ nằm ngay tâm chữ ROLE ở trên) */}
                                <div className="flex justify-center">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide uppercase block w-fit
                            ${user.role === 'admin'
                                            ? 'bg-purple-50 text-purple-600 border border-purple-200/40'
                                            : 'bg-blue-50 text-blue-600 border border-blue-200/40'
                                        }`}>
                                        {user.role === 'admin' ? 'Admin' : 'Customer'}
                                    </span>
                                </div>

                                {/* 4. Ngày tạo (Căn giữa - Thẳng hàng hoàn hảo) */}
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-slate-500">{formatDate(user.created_at)}</p>
                                </div>

                                {/* 5. Hành động (Căn phải hoàn toàn kịch biên) */}
                                <div className="flex items-center justify-around gap-1.5 h-full">
                                    {user.role !== 'admin' ? (
                                        <>
                                            <button
                                                onClick={() => openModal(user)}
                                                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs
                                  ${user.status === 'active'
                                                        ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                                                        : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {user.status === 'active' ? 'Lock' : 'Unlock'}
                                            </button>

                                            <button
                                                onClick={() => setEditEmailUser(user)}
                                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer shadow-2xs"
                                            >
                                                Email
                                            </button>

                                            <button
                                                onClick={() => setHistoryUser(user)}
                                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                                            >
                                                History
                                            </button>

                                            <button
                                                onClick={() => setDeleteModal(user)}
                                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-rose-100 bg-rose-50/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-bold tracking-wide select-none border border-slate-200/40">
                                            🛡️ System Protected
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    )
}