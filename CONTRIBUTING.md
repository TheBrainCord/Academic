# Contributing to IoT at CHRIST

Thank you for your interest in contributing. This project welcomes bug fixes, features, documentation improvements, and new subject definitions from academic institutions and developers.

## Ways to Contribute

- **Bug reports** — open an issue describing the problem and steps to reproduce
- **Feature requests** — open an issue with the use case and expected behaviour
- **Code contributions** — fork the repo, make your changes, and open a pull request
- **New subjects** — add a YAML definition in `content/subjects/` and open a PR
- **Documentation** — improve setup guides, API docs, or inline comments

## Development Setup

1. Fork and clone the repository
2. Follow the [Getting Started](README.md#getting-started) guide
3. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Make your changes with clear, focused commits
5. Run checks before opening a PR:
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```
6. Open a pull request against `main` with a clear description

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a short description of what changed and why
- If fixing a bug, reference the issue number
- Ensure `lint`, `type-check`, and `test` all pass
- Do not commit `.env` files or secrets

## Commit Style

Use conventional commits:

```
feat: add assignment deadline notifications
fix: correct role check for coordinator pages
docs: update database migration instructions
chore: bump Next.js to 14.2
```

## Code Style

- TypeScript strict mode — no `any` unless justified
- Components use functional style with clear prop types
- Server-side secrets stay in `lib/` — never imported into client components
- Supabase queries go through typed helpers in `lib/`

## Database Changes

- New migrations go in `supabase/migrations/` with a numbered prefix (`003_your_change.sql`)
- Include both the migration and any corresponding TypeScript type updates in `types/database.ts`

## Reporting Security Issues

Do not open public issues for security vulnerabilities. Email the maintainer directly at ravesh.ashok.naik@gmail.com.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
