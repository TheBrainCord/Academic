import { createClient } from '@/lib/supabase/server'
import { MissionCard } from '@/components/student/MissionCard'

export default async function StudentMissionsPage() {
  const supabase = createClient()

  // Missions are stored in the subject config JSONB (loaded from iot.yaml)
  const { data: subject } = await supabase
    .from('subjects')
    .select('config')
    .eq('slug', 'iot')
    .single()

  const missions = (subject?.config as any)?.missions ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-christ-navy">Missions</h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1">
          Real-world IoT challenges. Complete sessions to unlock harder missions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {missions.map((mission: any, i: number) => (
          <MissionCard key={i} mission={mission} />
        ))}
      </div>
    </div>
  )
}
