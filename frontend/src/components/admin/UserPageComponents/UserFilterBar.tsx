// src/components/admin/UserFilterBar.tsx
import type { UserStatusFilter } from '../../../types/admin.types';

const STATUS_TABS: { label: string; value: UserStatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Locked', value: 'locked' },
];


interface UserFilterBarProps {
    statusFilter: UserStatusFilter;
    handleStatusFilter: (status: UserStatusFilter) => void;
    searchInput: string;
    setSearchInput: (value: string) => void;
    handleSearch: () => void;
    handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    search: string;
    setSearch: (value: string) => void;
    setPage: (value: number) => void;
}

export default function UserFilterBar({
    statusFilter,
    handleStatusFilter,
    searchInput,
    setSearchInput,
    handleSearch,
    handleSearchKeyDown,
    search,
    setSearch,
    setPage,
}: UserFilterBarProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-slate-50/50 p-3 rounded-2xl border border-slate-200/60">
            {/* Status tabs */}
            <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl w-fit">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => handleStatusFilter(tab.value)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer
                      ${statusFilter === tab.value
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Input Group */}
            <div className="flex items-center gap-2 w-full lg:max-w-md">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search by user name, email address..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 outline-hidden transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-xs font-bold shadow-xs shadow-blue-500/10 cursor-pointer"
                >
                    Find
                </button>
                {search && (
                    <button
                        onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    )
}