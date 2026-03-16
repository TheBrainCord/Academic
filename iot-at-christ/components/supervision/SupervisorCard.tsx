import type { Profile, SupervisorType } from '@/types/database'

interface Props {
  supervisor:      Profile
  supervisorType:  SupervisorType
  taggedPhases?:   number[]
  taggedSections?: string[]
  onRemove?:       () => void  // only rendered for coordinators
}

export default function SupervisorCard({
  supervisor,
  supervisorType,
  taggedPhases = [],
  taggedSections = [],
  onRemove,
}: Props) {
  return (
    <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl bg-white">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-christ-navy text-white flex items-center justify-center text-sm font-semibold shrink-0">
        {supervisor.avatar_url ? (
          <img src={supervisor.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          (supervisor.full_name ?? supervisor.email).slice(0, 2).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-900 text-sm">
            {supervisor.full_name ?? supervisor.email}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              supervisorType === 'primary'
                ? 'bg-christ-navy text-white'
                : 'bg-christ-saffron/10 text-christ-saffron'
            }`}
          >
            {supervisorType === 'primary' ? 'Primary Supervisor' : 'Domain Advisor'}
          </span>
        </div>

        {supervisor.bio_short && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{supervisor.bio_short}</p>
        )}

        {supervisor.expertise_domains.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {supervisor.expertise_domains.map(d => (
              <span key={d} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {d}
              </span>
            ))}
          </div>
        )}

        {supervisorType === 'advisor' && (taggedPhases.length > 0 || taggedSections.length > 0) && (
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            {taggedPhases.length > 0 && (
              <p>Phases: {taggedPhases.join(', ')}</p>
            )}
            {taggedSections.length > 0 && (
              <p>Sections: {taggedSections.join(', ')}</p>
            )}
          </div>
        )}
      </div>

      {/* Remove button (coordinator only) */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-xs text-red-500 hover:text-red-700 shrink-0"
        >
          Remove
        </button>
      )}
    </div>
  )
}
