// Google Classroom API — READ ONLY. This platform never writes to Classroom.

export interface ClassroomStudent {
  googleId:  string
  fullName:  string
  email:     string
  photoUrl:  string
}

export interface ClassroomAssignment {
  id:          string
  title:       string
  maxPoints:   number
  dueDate?:    string
  courseWorkId: string
}

export interface ClassroomGrade {
  studentId:    string
  courseWorkId: string
  assignedGrade: number | null
  state:         string
}

async function fetchClassroom(endpoint: string, accessToken: string) {
  const res = await fetch(`https://classroom.googleapis.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`Classroom API error ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

export async function getCourseRoster(
  courseId: string,
  accessToken: string
): Promise<ClassroomStudent[]> {
  const data = await fetchClassroom(
    `/courses/${courseId}/students?pageSize=100`,
    accessToken
  )
  return (data.students ?? []).map((s: any) => ({
    googleId:  s.userId,
    fullName:  s.profile?.name?.fullName ?? '',
    email:     s.profile?.emailAddress ?? '',
    photoUrl:  s.profile?.photoUrl ?? '',
  }))
}

export async function getCourseAssignments(
  courseId: string,
  accessToken: string
): Promise<ClassroomAssignment[]> {
  const data = await fetchClassroom(
    `/courses/${courseId}/courseWork?pageSize=100`,
    accessToken
  )
  return (data.courseWork ?? []).map((cw: any) => ({
    id:           cw.id,
    courseWorkId: cw.id,
    title:        cw.title,
    maxPoints:    cw.maxPoints ?? 100,
    dueDate:      cw.dueDate
      ? `${cw.dueDate.year}-${String(cw.dueDate.month).padStart(2, '0')}-${String(cw.dueDate.day).padStart(2, '0')}`
      : undefined,
  }))
}

export async function getStudentGrades(
  courseId: string,
  studentId: string,
  accessToken: string
): Promise<ClassroomGrade[]> {
  const data = await fetchClassroom(
    `/courses/${courseId}/courseWork/-/studentSubmissions?userId=${studentId}&pageSize=100`,
    accessToken
  )
  return (data.studentSubmissions ?? []).map((sub: any) => ({
    studentId:     sub.userId,
    courseWorkId:  sub.courseWorkId,
    assignedGrade: sub.assignedGrade ?? null,
    state:         sub.state,
  }))
}
