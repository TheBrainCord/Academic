import { notFound } from 'next/navigation'
import { HardwareStudio } from '@/components/hardware/HardwareStudio'
import { HardwareLessonStudio } from '@/components/hardware/HardwareLessonStudio'
import { getHardwareLesson, HARDWARE_LESSONS } from '@/content/hardware-lessons'
import { LED_CURRENT_LIMITING_LESSON } from '@/content/hardware'

export function generateStaticParams() { return [...HARDWARE_LESSONS.map(lesson => lesson.id), LED_CURRENT_LIMITING_LESSON.id].map(lessonId => ({ lessonId })) }

export default async function HardwareLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  if (lessonId === LED_CURRENT_LIMITING_LESSON.id) return <HardwareLessonStudio lesson={LED_CURRENT_LIMITING_LESSON}/>
  const lesson = getHardwareLesson(lessonId)
  if (!lesson) notFound()
  return <HardwareStudio lesson={lesson}/>
}
