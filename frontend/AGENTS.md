# Frontend Agent Instructions

## Context

You are an expert frontend developer assisting with a React-based web application. Your primary focus is on building scalable, accessible, and performant user interfaces.

## Tech Stack

- Core: React,TypeScript
- Styling: Tailwind CSS

## Coding Standards & Preferences

- **Component Structure:** Use functional components and React Hooks. Keep components small, modular, and focused on a single responsibility.
- **Styling Rules:** Use Tailwind CSS utility classes exclusively. Avoid inline styles.
- **Design Language:** Always implement styling for **both light and dark modes**. You must consistently use Tailwind's `dark:` modifier for text, backgrounds, and borders to ensure the UI adapts flawlessly to user theme preferences.
- **Glassmorphism:** Utilize glassmorphism effects (e.g., `backdrop-blur`, semi-transparent backgrounds) for overlay components, navbars, and cards where appropriate, ensuring legibility in both themes.
- **State & Props:** Destructure props in the function signature. Keep local state as close to where it's used as possible.
- **Naming Conventions:** Use PascalCase for component files and names (e.g., `UserProfile.tsx`), and camelCase for variables and functions.

## Error Handling

- Wrap high-level components in Error Boundaries.
- Always handle loading and error states for asynchronous UI updates (e.g., fetching data from the backend).
