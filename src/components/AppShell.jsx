import { useState, useEffect, useCallback } from 'react'

const SIDEBAR_KEY = 'sidebar-collapsed'

const LibraryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="14" height="16" rx="2" />
    <path d="M7 2v16" />
    <path d="M11 8h3" />
    <path d="M11 11h3" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="3" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 5h14M3 10h14M3 15h14" />
  </svg>
)

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
  </svg>
)

const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" />
    <path d="M10 11l3-3-3-3" />
    <path d="M13 8H6" />
  </svg>
)

const NAV_ITEMS = [
  { key: 'library', label: 'Library', icon: LibraryIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function AppShell({ user, onSignOut, currentPage, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed)
    } catch {}
  }, [collapsed])

  // Close mobile sidebar on navigation
  const handleNavigate = useCallback((page) => {
    onNavigate(page)
    setMobileOpen(false)
  }, [onNavigate])

  // Close mobile sidebar on escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mobileOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const displayName = user?.user_metadata?.display_name || user?.email || 'User'
  const email = user?.email || ''
  const avatarLetter = (displayName[0] || 'U').toUpperCase()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Top: Logo + collapse toggle */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2 min-h-[56px]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="text-amber flex-shrink-0">
            <BookIcon />
          </span>
          {!collapsed && (
            <span className="font-serif text-cream text-base font-medium whitespace-nowrap">
              Book Companion
            </span>
          )}
        </div>
        {/* Collapse button — hidden on mobile overlay since it's always expanded there */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-md text-cream-dim/40 hover:text-cream hover:bg-ink-lighter transition-colors cursor-pointer flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}>
            <ChevronLeftIcon />
          </span>
        </button>
      </div>

      {/* Middle: Navigation */}
      <nav className="flex-1 px-2 pt-4 space-y-0.5">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = currentPage === key
          return (
            <button
              key={key}
              onClick={() => handleNavigate(key)}
              title={collapsed ? label : undefined}
              className={`
                w-full flex items-center gap-3 rounded-lg cursor-pointer
                transition-colors duration-150
                ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-amber/15 text-amber'
                  : 'text-cream-dim/60 hover:text-cream hover:bg-ink-lighter/60'
                }
              `}
            >
              <span className="flex-shrink-0"><Icon /></span>
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom: User profile */}
      <div className="px-2 pb-4 pt-2 border-t border-ink-lighter/50 mt-2">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2'}`}>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-amber/20 text-amber flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {avatarLetter}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-cream text-sm font-medium truncate leading-tight">
                {displayName}
              </p>
              {email && email !== displayName && (
                <p className="text-cream-dim/40 text-xs truncate leading-tight mt-0.5">
                  {email}
                </p>
              )}
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onSignOut}
              className="text-cream-dim/30 hover:text-cream transition-colors cursor-pointer flex-shrink-0 p-1 rounded-md hover:bg-ink-lighter/60"
              title="Sign out"
            >
              <SignOutIcon />
            </button>
          )}
        </div>
        {/* Sign out when collapsed — show below avatar */}
        {collapsed && (
          <button
            onClick={onSignOut}
            className="mt-2 w-full flex justify-center text-cream-dim/30 hover:text-cream transition-colors cursor-pointer p-1 rounded-md hover:bg-ink-lighter/60"
            title="Sign out"
          >
            <SignOutIcon />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-ink">
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col flex-shrink-0
          bg-ink-light border-r border-ink-lighter
          transition-all duration-200 ease-in-out
          ${collapsed ? 'w-[56px]' : 'w-[240px]'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-[260px] z-50
          bg-ink-light border-r border-ink-lighter
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Force expanded in mobile view by rendering sidebar content directly (collapsed is always false in mobile context) */}
        <div className="flex flex-col h-full">
          {/* Top: Logo + close */}
          <div className="flex items-center justify-between px-3 pt-4 pb-2 min-h-[56px]">
            <div className="flex items-center gap-2.5">
              <span className="text-amber flex-shrink-0">
                <BookIcon />
              </span>
              <span className="font-serif text-cream text-base font-medium whitespace-nowrap">
                Book Companion
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-cream-dim/40 hover:text-cream hover:bg-ink-lighter transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 pt-4 space-y-0.5">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
              const isActive = currentPage === key
              return (
                <button
                  key={key}
                  onClick={() => handleNavigate(key)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-amber/15 text-amber'
                      : 'text-cream-dim/60 hover:text-cream hover:bg-ink-lighter/60'
                    }
                  `}
                >
                  <span className="flex-shrink-0"><Icon /></span>
                  <span className="text-sm font-medium">{label}</span>
                </button>
              )
            })}
          </nav>

          {/* User profile */}
          <div className="px-2 pb-4 pt-2 border-t border-ink-lighter/50 mt-2">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-amber/20 text-amber flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-cream text-sm font-medium truncate leading-tight">
                  {displayName}
                </p>
                {email && email !== displayName && (
                  <p className="text-cream-dim/40 text-xs truncate leading-tight mt-0.5">
                    {email}
                  </p>
                )}
              </div>
              <button
                onClick={onSignOut}
                className="text-cream-dim/30 hover:text-cream transition-colors cursor-pointer flex-shrink-0 p-1 rounded-md hover:bg-ink-lighter/60"
                title="Sign out"
              >
                <SignOutIcon />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 w-9 h-9 rounded-lg bg-ink-light/90 border border-ink-lighter flex items-center justify-center text-cream-dim hover:text-cream hover:bg-ink-lighter transition-colors cursor-pointer"
          title="Open menu"
        >
          <MenuIcon />
        </button>

        {children}
      </main>
    </div>
  )
}
