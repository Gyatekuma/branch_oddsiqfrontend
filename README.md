# OddsIQ Frontend

Vue.js 3 SPA for the OddsIQ sports prediction and odds aggregation platform.

## Tech Stack

- **Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Internationalization**: Vue i18n (English + French)
- **Charts**: Chart.js via vue-chartjs
- **Icons**: Heroicons

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key for payments | - |
| `VITE_APP_NAME` | Application name | `OddsIQ` |
| `VITE_DEFAULT_LOCALE` | Default language (en/fr) | `en` |

### Connecting to Backend

1. Ensure the OddsIQ Flask API is running on the URL specified in `VITE_API_BASE_URL`
2. The Vite dev server proxies `/api` requests to the backend

## Scripts

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── api/          # Axios instances and API modules
├── assets/       # Static assets and styles
├── components/   # Reusable Vue components
├── composables/  # Vue composition functions
├── i18n/         # Internationalization files
├── router/       # Vue Router configuration
├── stores/       # Pinia stores
└── views/        # Page components
```

## Adding i18n Strings

1. Add the English string to `src/i18n/en.json`
2. Add the French translation to `src/i18n/fr.json`
3. Use in components with `$t('key')` or `t('key')` with `useI18n()`

Example:
```json
// en.json
{ "nav.home": "Home" }

// fr.json
{ "nav.home": "Accueil" }
```

```vue
<template>
  <span>{{ $t('nav.home') }}</span>
</template>
```

## Features

- **Freemium Model**: Free users see 3 predictions, premium users get full access
- **Bilingual**: Full English and French support
- **Responsive**: Mobile-first design with bottom navigation
- **Real-time Odds**: Aggregated odds from multiple bookmakers
- **Accuracy Tracking**: Public accuracy statistics

## License

Proprietary - All rights reserved
