# Adding a New Subject

1. Create a new YAML file in `/content/subjects/` — e.g. `ml.yaml`
2. Follow the schema defined in `_schema.ts`
3. The minimum required fields are: `slug`, `name`, `description`, `year`, `semester`, `units`
4. Run the seed script: `npm run seed`
5. The new subject will appear in the platform automatically — no code changes needed

## YAML Structure

```yaml
slug: ml              # lowercase, no spaces (used as DB identifier)
name: "ML at CHRIST"
description: "..."
year: "2025-26"
semester: "Semester 3"
curriculumStatus:
  officialSyllabusLabel: "Official syllabus content"
  livingCurriculumLabel: "Living curriculum update"
  lastVerified: "2026-08-29"
units:
  - number: 1
    title: "Introduction to ML"
    hours: 6
    icon: "🧠"
    color: "#1565C0"
    sessions:
      - number: 1
        title: "What is Machine Learning?"
        hours: 2
        topics:
          - "Supervised vs unsupervised learning"
        keywords: ["Regression", "Classification", "Clustering"]
        assignment:
          type: "Reflection"
          task: "Identify 3 ML applications you use daily"
          xp: 50
          due_days: 7
```

Time-sensitive product availability, law, version, deployment-scale, and measured-outcome
claims must include session-level `references`. Each reference records a title, authoritative
URL, publisher, the exact claim scope it supports, and an ISO `lastVerified` date. Unsupported
figures should be removed or explicitly presented as hypothetical assignment inputs.

See `iot.yaml` for a complete example with all optional fields.
