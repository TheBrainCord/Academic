// TypeScript types matching the YAML subject schema
// Keep in sync with /content/subjects/_schema.ts

export interface Assignment {
  type:     string
  task:     string
  xp:       number
  due_days: number
}

export interface CaseStudy {
  title:       string
  org:         string
  description: string
}

export interface Session {
  number:               number
  title:                string
  hours:                number
  topics:               string[]
  keywords:             string[]
  case_study?:          CaseStudy
  tools?:               string[]
  assignment?:          Assignment
  no_hw_alternative?:   string
}

export interface Unit {
  number:      number
  title:       string
  hours:       number
  icon:        string
  color:       string
  sessions:    Session[]
}

export interface Mission {
  title:        string
  story:        string
  situation:    string
  challenge:    string
  deliverables: string[]
  hints:        string[]
  domain:       string
  difficulty:   'Easy' | 'Medium' | 'Hard'
  xp:           number
  status:       'active' | 'locked'
  tags:         string[]
  unlock_after_unit?: number
}

export interface Subject {
  slug:        string
  name:        string
  description: string
  year:        string
  semester:    string
  units:       Unit[]
  missions?:   Mission[]
}
