import { NavLink } from 'react-router-dom';

export function NavigationLink({ currentNavItems }: { currentNavItems: any[] }) {
  return (
    <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
      <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Menu</p>

      {currentNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `group relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
                : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />}
              <span className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-105 text-slate-400 group-hover:text-slate-600'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}