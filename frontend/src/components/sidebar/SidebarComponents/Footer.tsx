
export function Footer({ user, handleLogout }: { user: any; handleLogout: () => void }) {
  const avatarLetter = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="p-4 border-t border-slate-200/50 bg-slate-100/40">
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
          {avatarLetter}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
            {user?.full_name ?? 'Guest User'}
            {user?.role === 'admin' && (
              <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                Admin
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email ?? '—'}</p>
        </div>
      </div>

      {/* Nút Logout */}
      <button
        onClick={handleLogout}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200/60 hover:border-transparent active:scale-[0.98] transition-all duration-150 shadow-sm shadow-rose-500/5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>
  );
}