# Course source materials

This directory is the controlled intake point for documents used to align Course
Studio with the institution's IoT course. It deliberately contains no recreated
or inferred document content. A `missing` entry in `manifest.json` is a request
for the genuine source, not permission to manufacture a substitute.

## Authority and curriculum use

`official-syllabus.pdf` is the authoritative document once its manifest entry is
`verified` by the lecturer. It governs course scope, learning outcomes,
assessment requirements, and prescribed topics. If any Course Studio content
conflicts with it, the official syllabus takes precedence.

Lecturer notes and reading lists provide interpretation and supporting material.
Interactive explanations, simulations, new tools, recent protocols, case
studies, and other modern additions are living-curriculum supplements. They may
be updated to keep teaching relevant, but they must not be presented as changes
to the official syllabus.

## Expected filenames

Use stable, lowercase filenames so manifest records and review links remain
valid:

| Filename | Purpose | Authority |
| --- | --- | --- |
| `official-syllabus.pdf` | Institution-issued syllabus for the course and applicable cohort | Authoritative after lecturer verification |
| `lecturer-notes.pdf` | Notes supplied or approved by the course lecturer | Supporting interpretation only |
| `prescribed-reading-list.pdf` | Institution- or lecturer-issued prescribed reading list | Supporting source; the syllabus prevails on conflict |

Do not commit similarly named placeholders. When a genuine document is not
available, leave the file absent and keep its manifest status as `missing`.

## Intake and verification workflow

1. Confirm that the document came from an institution-controlled location or
   directly from the responsible lecturer. Do not treat an unattributed web copy
   as official.
2. Confirm permission to store the file in this repository. Course documents may
   be copyrighted, licensed for enrolled-student access, or contain personal or
   access-restricted information. If repository storage is not permitted, keep
   the file out of Git and record only a non-secret provenance reference in the
   manifest.
3. Save an allowed document under its expected filename without editing its
   contents. Record its edition/date when the document supplies one and, when
   useful, a SHA-256 checksum.
4. Change the status to `available` only after the genuine document or an approved
   access-controlled reference can be inspected.
5. A responsible lecturer must compare the source with the applicable course and
   cohort before the status becomes `verified`. Record their name, verification
   date, and a short note; do not infer verification from availability.

Never commit credentials, private sharing links, student data, or documents whose
copyright or access terms prohibit repository distribution. A checksum verifies
file identity, not authority, licensing, or lecturer approval.

## Manifest format

`manifest.json` is the inventory of expected sources. Each source has a stable
`id`, expected `filename`, curriculum `role`, and one of these statuses:

- `missing`: the genuine source is not currently available for review;
- `available`: the genuine source can be reviewed, but lecturer verification is
  incomplete;
- `verified`: the lecturer has confirmed that the source and edition apply to
  this course.

`editionOrDate`, `checksum`, and `lecturerVerification` may be `null` until known.
Checksums use an object that names the algorithm rather than an unlabeled digest.
Update the manifest in the same commit as any permitted source document or status
change.
