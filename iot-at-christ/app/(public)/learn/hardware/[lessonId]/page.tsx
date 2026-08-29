import { notFound } from 'next/navigation'
import { HardwareStudio } from '@/components/hardware/HardwareStudio'
import { getHardwareLesson, HARDWARE_LESSONS } from '@/content/hardware-lessons'

export function generateStaticParams() { return HARDWARE_LESSONS.map(lesson => ({ lessonId: lesson.id })) }

export default async function HardwareLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  const lesson = getHardwareLesson(lessonId)
  if (!lesson) notFound()
  return <HardwareStudio lesson={lesson}/>
}
