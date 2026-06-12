import { notFound } from 'next/navigation'
import { LectureViewer } from '@/components/lectures/LectureViewer'
import { UNIT2_MODULES, getModule } from '@/content/lectures/unit2'

// Static lecture content — prebuild every module page.
export function generateStaticParams() {
  return UNIT2_MODULES.map((m) => ({ moduleId: m.id }))
}

export default async function LectureModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const mod = getModule(moduleId)
  if (!mod) notFound()
  return <LectureViewer module={mod} />
}
