'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DOMAIN_SUGGESTIONS = [
  'IoT', 'Machine Learning', 'Computer Vision', 'Edge Computing',
  'Embedded Systems', 'Wireless Networks', 'Cybersecurity', 'Cloud Computing',
  'Robotics', 'Signal Processing', 'Data Engineering', 'Healthcare Technology',
]

export default function SupervisorOnboarding() {
  const router = useRouter()
  const supabase = createClient()

  const [bio,        setBio]        = useState('')
  const [domains,    setDomains]    = useState<string[]>([])
  const [linkedin,   setLinkedin]   = useState('')
  const [slots,      setSlots]      = useState(5)
  const [loading,    setLoading]    = useState(false)
  const [fetching,   setFetching]   = useState(true)
  const [domainInput, setDomainInput] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('bio_short, expertise_domains, linkedin_url, available_slots')
        .eq('id', user.id)
        .single()
      if (data) {
        setBio(data.bio_short ?? '')
        setDomains(data.expertise_domains ?? [])
        setLinkedin(data.linkedin_url ?? '')
        setSlots(data.available_slots ?? 5)
      }
      setFetching(false)
    }
    load()
  }, [])

  function addDomain(d: string) {
    const trimmed = d.trim()
    if (trimmed && !domains.includes(trimmed)) {
      setDomains(prev => [...prev, trimmed])
    }
    setDomainInput('')
  }

  function removeDomain(d: string) {
    setDomains(prev => prev.filter(x => x !== d))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({
        bio_short:          bio,
        expertise_domains:  domains,
        linkedin_url:       linkedin,
        available_slots:    slots,
      })
      .eq('id', user.id)

    setLoading(false)
    router.push('/supervisor/dashboard')
  }

  if (fetching) return <div className="p-8 text-sm text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Supervisor Profile</h1>
      <p className="text-sm text-gray-500 mb-8">
        Complete your profile so students and coordinators can match you to projects.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            required
            placeholder="Research interests, current projects, background…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{bio.length}/300 characters</p>
        </div>

        {/* Expertise Domains */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expertise Domains</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {domains.map(d => (
              <span
                key={d}
                className="inline-flex items-center gap-1 bg-christ-navy/10 text-christ-navy text-xs px-2 py-1 rounded-full"
              >
                {d}
                <button type="button" onClick={() => removeDomain(d)} className="hover:text-red-500">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={domainInput}
              onChange={e => setDomainInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDomain(domainInput) } }}
              placeholder="Type a domain and press Enter"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy"
            />
            <button
              type="button"
              onClick={() => addDomain(domainInput)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {DOMAIN_SUGGESTIONS.filter(d => !domains.includes(d)).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => addDomain(d)}
                className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full"
              >
                + {d}
              </button>
            ))}
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input
            type="url"
            value={linkedin}
            onChange={e => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy"
          />
        </div>

        {/* Available slots */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Project Slots ({slots})
          </label>
          <input
            type="range"
            min={0}
            max={20}
            value={slots}
            onChange={e => setSlots(Number(e.target.value))}
            className="w-full accent-christ-navy"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span><span>10</span><span>20</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !bio.trim()}
          className="w-full py-2.5 text-sm font-medium text-white bg-christ-navy rounded-lg hover:bg-christ-navy/90 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
