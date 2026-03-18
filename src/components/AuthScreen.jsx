import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthScreen({ onAuth }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setDisplayName('')
    setError(null)
    setSignUpSuccess(false)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName)
        setSignUpSuccess(true)
      } else {
        const data = await signIn(email, password)
        onAuth?.(data)
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* App title */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-cream tracking-tight mb-1">
            Book Companion
          </h1>
          <p className="text-cream-dim/60 text-sm">
            Your personal study space
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-ink-light border border-ink-lighter mb-8 overflow-hidden">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-amber text-ink'
                : 'text-cream-dim hover:text-cream'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-amber text-ink'
                : 'text-cream-dim hover:text-cream'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Sign-up confirmation message */}
        {signUpSuccess && (
          <div className="mb-6 rounded-lg border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-cream">
            Check your email for a confirmation link to complete your sign-up.
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label className="block text-cream-dim text-sm mb-2 font-medium">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                required
                className="w-full bg-ink-light border border-ink-lighter rounded-lg px-4 py-3 text-cream placeholder-cream-dim/50 focus:outline-none focus:border-amber transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-cream-dim text-sm mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-ink-light border border-ink-lighter rounded-lg px-4 py-3 text-cream placeholder-cream-dim/50 focus:outline-none focus:border-amber transition-colors"
            />
          </div>

          <div>
            <label className="block text-cream-dim text-sm mb-2 font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full bg-ink-light border border-ink-lighter rounded-lg px-4 py-3 text-cream placeholder-cream-dim/50 focus:outline-none focus:border-amber transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber hover:bg-amber-dim disabled:opacity-50 disabled:cursor-not-allowed text-ink font-semibold rounded-lg py-3 text-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
            )}
            {loading
              ? mode === 'signin' ? 'Signing in...' : 'Creating account...'
              : mode === 'signin' ? 'Sign In' : 'Create Account'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
