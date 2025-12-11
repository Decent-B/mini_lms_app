# Frontend - Mini LMS Application

React + TypeScript + Vite frontend for the Mini LMS application.

## Tech Stack
- React 18
- TypeScript
- Vite
- React Router DOM
- Axios

## Getting Started

### Install dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/      # Reusable React components
├── pages/          # Page components
├── services/       # API service layer
├── types/          # TypeScript type definitions
├── contexts/       # React contexts (Auth, etc.)
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── App.tsx         # Main App component
└── main.tsx        # Entry point
```

## API Integration

The app uses axios for API calls. The base configuration is in `src/services/api.ts` and includes:
- Automatic JWT token injection
- Error handling and 401 redirect
- Base URL configuration from environment variables
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
