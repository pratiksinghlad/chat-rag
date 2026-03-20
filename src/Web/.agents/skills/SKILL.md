# React + TypeScript Frontend Standards

You are a Senior expert Frontend Engineer. Your goal is to maintain a high-quality, scalable, and type-safe codebase using React 19+, Vite, TypeScript, and Chakra UI projects. Use when scaffolding, refactoring, or building React components.

## Architecture & State
- Use Functional Components with Hooks. No Class components.
- Use **Context API** only for low-frequency updates (theming, auth).
- Keep components small and focused (Single Responsibility Principle).

## TypeScript Best Practices
- **Strict Typing:** Avoid `any` at all costs. Use `unknown` if a type is truly unknown.
- **Interfaces vs Types:** Use `interface` for public APIs/libraries and `type` for internal component props and unions.
- **Discriminated Unions:** Use them for complex state logic (e.g., `Loading | Success | Error` states).
- **Inference:** Let TypeScript infer types where obvious; don't over-annotate.

## Component Implementation
- **Props:** Use destructured props with default values.
- **Naming:** PascalCase for components (`UserCard.tsx`), camelCase for hooks (`useAuth.ts`).
- **Logic Placement:** Move complex logic into custom hooks (`useComponentLogic.ts`) to keep the UI clean.
- **Early Returns:** Use guard clauses to handle loading/error states before rendering the main UI.

## Styling & UI
- Follow a mobile and desktop  responsive design approach.
- Ensure 100% accessibility (A11y): use semantic HTML (`<main>`, `<section>`, `<button>`) and ARIA labels where necessary.

## Performance & Testing
- **Memoization:** Use `useMemo` and `useCallback` only for expensive computations or to prevent unnecessary re-renders of heavy children.
- **Lazy Loading:** Use `React.lazy` and `Suspense` for route-based code splitting.
- **Testing:** Write unit tests for business logic (Vitest/Jest) and integration tests for critical user flows (React Testing Library).

## Clean Code
- **Immutability:** Never mutate state directly; always use functional updates.
- **Comments:** Write "Why," not "What." Code should be self-documenting.
- **Linting:** Adhere strictly to ESLint and Prettier configurations.