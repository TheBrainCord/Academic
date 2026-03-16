import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // Edge Functions use service role
)

serve(async (req) => {
  try {
    const { teacherId } = await req.json()

    // Get teacher's Google access token
    const { data: teacher } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token')
      .eq('id', teacherId)
      .single()

    if (!teacher?.google_access_token) {
      return new Response(JSON.stringify({ error: 'No Google token for teacher' }), { status: 400 })
    }

    // Fetch all enrollments to get classroom course IDs
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('classroom_course_id')
      .not('classroom_course_id', 'is', null)

    const courseIds = [...new Set(enrollments?.map(e => e.classroom_course_id) ?? [])]
    let totalStudents = 0
    let totalGrades   = 0
    const errors: string[] = []

    for (const courseId of courseIds) {
      try {
        // Fetch roster
        const rosterRes = await fetch(
          `https://classroom.googleapis.com/v1/courses/${courseId}/students?pageSize=100`,
          { headers: { Authorization: `Bearer ${teacher.google_access_token}` } }
        )
        const roster = await rosterRes.json()

        for (const student of roster.students ?? []) {
          // Upsert profile
          await supabase.from('profiles').upsert({
            id:        student.userId,
            email:     student.profile?.emailAddress,
            full_name: student.profile?.name?.fullName,
            avatar_url: student.profile?.photoUrl,
            google_id: student.userId,
            role:      'student',
          }, { onConflict: 'google_id', ignoreDuplicates: false })

          // Upsert enrollment
          const { data: subj } = await supabase
            .from('enrollments')
            .select('subject_id')
            .eq('classroom_course_id', courseId)
            .limit(1)
            .single()

          if (subj) {
            await supabase.from('enrollments').upsert({
              student_id:           student.userId,
              subject_id:           subj.subject_id,
              classroom_course_id:  courseId,
            }, { onConflict: 'student_id,subject_id' })
          }

          totalStudents++
        }
      } catch (e: any) {
        errors.push(`courseId ${courseId}: ${e.message}`)
      }
    }

    // Log the sync
    await supabase.from('sync_log').insert({
      teacher_id:    teacherId,
      student_count: totalStudents,
      grade_count:   totalGrades,
      status:        errors.length ? 'partial' : 'success',
      errors:        errors.length ? errors : null,
    })

    return new Response(JSON.stringify({ synced: totalStudents, errors }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
