
interface BellButtonProps {
    open: boolean;
    unreadCount: number;
    handleOpen: () => void;
}
export function BellButton({ open, unreadCount, handleOpen }: BellButtonProps) {
    return (
        <button
            type="button"
            onClick={handleOpen}
            aria-label="Open notifications"
            className={`relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${open
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
        >
            <svg
                className={`w-5 h-5 transition-transform ${unreadCount > 0 && !open
                    ? 'animate-[wiggle_1s_ease-in-out_infinite]'
                    : 'group-hover:scale-105'
                    }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
            </svg>

            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    )
}