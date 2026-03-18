import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const API_KEY_KEY = 'book-companion-apikey'
const OPENAI_KEY_KEY = 'book-companion-openai-key'

export default function Settings({ user }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [keysSaving, setKeysSaving] = useState(false)
  const [keysMsg, setKeysMsg] = useState(null)

  const [stats, setStats] = useState({ books: 0, readingTime: 0, highlights: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  // Load API keys from localStorage
  useEffect(() => {
    setAnthropicKey(localStorage.getItem(API_KEY_KEY) || '')
    setOpenaiKey(localStorage.getItem(OPENAI_KEY_KEY) || '')
  }, [])

  // Fetch reading stats from supabase
  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const [booksRes, progressRes, highlightsRes] = await Promise.all([
          supabase.from('books').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('reading_progress').select('total_reading_time_seconds').eq('user_id', user.id),
          supabase.from('highlights').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ])

        const totalSeconds = (progressRes.data || []).reduce(
          (sum, row) => sum + (row.total_reading_time_seconds || 0),
          0
        )

        setStats({
          books: booksRes.count || 0,
          readingTime: totalSeconds,
          highlights: highlightsRes.count || 0,
        })
      } catch {
        // silently fail
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [user])

  const formatTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds === 0) return '0m'
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id)
      if (error) throw error
      setProfileMsg({ type: 'success', text: 'Profile updated' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSaveKeys = () => {
    setKeysSaving(true)
    try {
      if (anthropicKey) {
        localStorage.setItem(API_KEY_KEY, anthropicKey)
      } else {
        localStorage.removeItem(API_KEY_KEY)
      }
      if (openaiKey) {
        localStorage.setItem(OPENAI_KEY_KEY, openaiKey)
      } else {
        localStorage.removeItem(OPENAI_KEY_KEY)
      }
      setKeysMsg({ type: 'success', text: 'API keys saved' })
    } catch {
      setKeysMsg({ type: 'error', text: 'Failed to save keys' })
    } finally {
      setKeysSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    alert('Contact support to delete your account')
  }

  return (
    <div className="min-h-screen bg-ink py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="font-serif text-3xl text-cream">Settings</h1>

        {/* Profile Section */}
        <section className="bg-ink-light border border-ink-lighter rounded-xl p-6">
          <h2 className="text-cream font-medium text-lg mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-cream-dim text-xs mb-1.5 font-medium">
                Display Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-ink border border-ink-lighter rounded-lg px-4 py-2.5 text-cream text-sm placeholder-cream-dim/40 focus:outline-none focus:border-amber"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="px-4 py-2 text-sm bg-amber text-ink rounded-lg cursor-pointer hover:bg-amber-dim transition-colors disabled:opacity-50"
                >
                  {profileSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              {profileMsg && (
                <p className={`text-xs mt-2 ${profileMsg.type === 'success' ? 'text-teal-light' : 'text-red-400'}`}>
                  {profileMsg.text}
                </p>
              )}
            </div>
            <div>
              <label className="block text-cream-dim text-xs mb-1.5 font-medium">
                Email
              </label>
              <p className="text-cream/80 text-sm">{user?.email || 'No email'}</p>
            </div>
          </div>
        </section>

        {/* API Keys Section */}
        <section className="bg-ink-light border border-ink-lighter rounded-xl p-6">
          <h2 className="text-cream font-medium text-lg mb-4">API Keys</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-cream-dim text-xs mb-1.5 font-medium">
                Anthropic API Key
              </label>
              <div className="relative">
                <input
                  type={showAnthropic ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-ink border border-ink-lighter rounded-lg px-4 py-2.5 pr-16 text-cream text-sm placeholder-cream-dim/40 focus:outline-none focus:border-amber"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropic(!showAnthropic)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-dim/50 hover:text-cream text-xs cursor-pointer transition-colors"
                >
                  {showAnthropic ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-cream-dim text-xs mb-1.5 font-medium">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenai ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-ink border border-ink-lighter rounded-lg px-4 py-2.5 pr-16 text-cream text-sm placeholder-cream-dim/40 focus:outline-none focus:border-amber"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-dim/50 hover:text-cream text-xs cursor-pointer transition-colors"
                >
                  {showOpenai ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-cream-dim/50 text-xs">Keys are stored locally in your browser</p>
              <button
                onClick={handleSaveKeys}
                disabled={keysSaving}
                className="px-4 py-2 text-sm bg-amber text-ink rounded-lg cursor-pointer hover:bg-amber-dim transition-colors disabled:opacity-50"
              >
                {keysSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {keysMsg && (
              <p className={`text-xs ${keysMsg.type === 'success' ? 'text-teal-light' : 'text-red-400'}`}>
                {keysMsg.text}
              </p>
            )}
          </div>
        </section>

        {/* Reading Stats Section */}
        <section className="bg-ink-light border border-ink-lighter rounded-xl p-6">
          <h2 className="text-cream font-medium text-lg mb-4">Reading Stats</h2>
          {statsLoading ? (
            <p className="text-cream-dim/50 text-sm">Loading stats...</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-serif text-amber">{stats.books}</p>
                <p className="text-cream-dim text-xs mt-1">Total Books</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-serif text-amber">{formatTime(stats.readingTime)}</p>
                <p className="text-cream-dim text-xs mt-1">Reading Time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-serif text-amber">{stats.highlights}</p>
                <p className="text-cream-dim text-xs mt-1">Highlights</p>
              </div>
            </div>
          )}
        </section>

        {/* Account Section */}
        <section className="bg-ink-light border border-ink-lighter rounded-xl p-6">
          <h2 className="text-cream font-medium text-lg mb-4">Account</h2>
          <p className="text-cream-dim/60 text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 text-sm bg-red-900/40 text-red-400 border border-red-800/50 rounded-lg cursor-pointer hover:bg-red-900/60 hover:text-red-300 transition-colors"
          >
            Delete Account
          </button>
        </section>
      </div>
    </div>
  )
}
