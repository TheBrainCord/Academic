import { notFound } from 'next/navigation'
import { LectureViewer } from '@/components/lectures/LectureViewer'
import { UNIT2_MODULES, getModule } from '@/content/lectures/unit2'
import { TeachingDeckViewer } from '@/components/lectures/TeachingDeckViewer'
import { UNIT4_DECKS, getUnit4Deck } from '@/content/lectures/unit4'
import { CourseStudio } from '@/components/course'
import { WEEKLY_PLANS, getWeeklyPlan } from '@/content/course'

// Static lecture content — prebuild every module page.
export function generateStaticParams() {
  return [
    ...UNIT2_MODULES.map((m) => m.id),
    ...UNIT4_DECKS.map((deck) => deck.id),
    ...WEEKLY_PLANS.map((plan) => plan.id),
  ].map((moduleId) => ({ moduleId }))
}

export default async function LectureModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const plan = getWeeklyPlan(moduleId)
  if (plan) return <CourseStudio plan={plan} />

  const unit4Deck = getUnit4Deck(moduleId)
  if (unit4Deck) return <TeachingDeckViewer deck={unit4Deck} />

  const lectureModule = getModule(moduleId)
  if (!lectureModule) notFound()
  return <LectureViewer module={lectureModule} />
}
