# React Slop 🎨

A repository full of experimental, spontaneous React applications—each living in its own branch.

## 🎯 Purpose

This is a playground for building quick, creative React apps without the pressure of perfection. Each branch contains a standalone application designed to solve a niche problem or
explore an interesting concept. Think of it as a digital sketchbook for React ideas.

## 📦 Structure

- **Main Branch**: Contains the base template and CI/CD configuration
- **Feature Branches**: Each branch houses a unique React application
- **GitHub Pages**: Automatically deploys all branches to persistent subfolders

## 🔄 Workflow

Every branch follows the same pattern:

1. **Auto-Deployment**: Push to any branch triggers an automatic build
2. **Dependency Management**: Missing dependencies are automatically detected and installed
3. **Project Slug**: Generated from `package.json` title/name for URL-friendly paths
4. **Registry Update**: `branches.json` maintains a live index of all deployed apps
5. **Persistent Deployment**: Each app lives at `https://harm-nullix.github.io/react-slop/{project-slug}/`

### Key Files

- **`package.json`**: Must include `title`, `description`, and optional `tags` for registry
  - Remember to update `name` to match the project slug!
- **`.github/workflows/nextjs.yml`**: Handles the entire build and deploy pipeline
- **`src/App.tsx`**: Single-file apps are encouraged for simplicity

## 🌐 Navigation

Visit the [live registry](https://harm-nullix.github.io/react-slop/branches.json) to see all deployed apps, or check the `gh-pages` branch for the complete file structure.

## 🛠️ Tech Stack

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Analytics**: Vercel Analytics (production only)

## 💡 App Guidelines

Each app should:

- Target a specific audience (≈1% of global population)
- Solve one clear problem with one solution
- Work statically without backend dependencies
- Be responsive (mobile + desktop)
- Support English & Dutch based on browser language
- Include micro-animations for polish
- Update document title dynamically

## 🚀 Quick Start

Create a new app:

1. **Create Branch**: `git checkout -b gen/YYYY/MM/DD/your-app-name`
2. **Configure**: Update `title`, `description`, and `tags` in `package.json`
3. **Develop**: Edit `src/App.tsx` (single-file apps preferred)
4. **Deploy**: `git push origin gen/YYYY/MM/DD/your-app-name`

## 🛠️ Maintenance

To keep all app branches up to date with the latest base template changes:

```bash
chmod +x merge_main_to_gen.sh
./merge_main_to_gen.sh
```

This script will:
- Iterate through all `gen/*` branches
- Merge `main` into each branch
- Resolve conflicts (preferring `src/App.tsx` from the feature branch and everything else from `main`)
- Push updates back to origin

## 📄 License

Not at all!
