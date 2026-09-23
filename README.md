# Thryve

Thryve is a multi-model AI conversation platform built around a simple idea: AI should remember the context that matters, give people choice over the models they use, and remain useful beyond a single chat window.

The application brings chat sessions, persistent memory, personal notes, model selection, exports, usage insights, billing, and account settings into one focused workspace. It is designed for people who use AI regularly and want more control over their conversations, context, and workflow.

> Thryve is the frontend application in this repository. It connects to a separate authenticated API for chat, memory, notes, model data, usage, billing, and related services.

## Why Thryve

Most AI chat products are optimized for one-off conversations. Thryve is built for ongoing work.

- **Multi-model conversations** — choose between available providers and models instead of being locked into one model.
- **Persistent memory** — save useful context and make it available across conversations.
- **Organized chat sessions** — create, rename, revisit, and delete conversations.
- **Notes alongside conversations** — turn useful ideas and responses into notes that can be managed separately.
- **Streaming responses** — see assistant output as it is generated instead of waiting for a complete response.
- **Model-aware usage** — model metadata includes pricing, context length, provider information, and free-model detection.
- **Account and subscription flows** — authentication, onboarding, plans, usage, billing, and upgrade prompts are part of the product experience.
- **Responsive interface** — the layout adapts to desktop and mobile, including mobile-friendly chat controls and safe-area handling.

## Product architecture

Thryve is a Vite-powered React single-page application. The code is intentionally organized around product boundaries rather than putting all behavior inside page components.

```text
Browser
  |
  v
React application
  |
  +-- React Router       page navigation and protected routes
  +-- Context providers  auth, theme, and onboarding state
  +-- Feature hooks      chat, sessions, models, memory, notes, payment, exports
  +-- UI components      product components plus reusable Radix/shadcn primitives
  |
  +-- Supabase           authentication and session lifecycle
  +-- API service        chat, model, memory, notes, usage, billing, and export endpoints
```

### Application shell

`src/main.tsx` bootstraps the application and loads the global stylesheet. `src/App.tsx` composes the main providers and route tree:

- `QueryClientProvider` provides shared server-state caching and mutation management.
- `ThemeProvider` manages light, dark, and system themes.
- `AuthProvider` owns the Supabase session and user state.
- `OnboardingProvider` determines whether a new user needs the onboarding flow.
- `BrowserRouter` maps the product areas to pages.
- `ProtectedRoute` keeps authenticated product routes behind the auth and onboarding checks.

This gives the application one consistent place for cross-cutting state while keeping individual features small and focused.

### Authentication and route protection

Authentication is handled through Supabase in `src/contexts/AuthContext.tsx` and `src/supabaseClient.ts`. The provider loads the initial session, listens for auth changes, exposes the current user and session, and clears stored tokens on sign-out.

Protected pages use `src/components/ProtectedRoute.tsx`. The route guard handles three states in order:

1. Wait for authentication to finish loading.
2. Redirect unauthenticated users to `/auth`.
3. Check onboarding status and show onboarding when required.
4. Render the requested page once the user is ready.

This keeps authentication concerns out of the individual pages and gives every protected feature the same behavior.

### Chat and server state

The core chat behavior lives in `src/hooks/useChat.ts` and is consumed by `src/components/ChatInterface.tsx`.

The hook is responsible for:

- Loading message history for a specific session.
- Creating, renaming, listing, and deleting chat sessions.
- Selecting an effective model with a safe free-model fallback.
- Sending authenticated messages to the API.
- Handling streaming responses using the browser `ReadableStream` API.
- Updating the interface optimistically before the server finishes responding.
- Marking failed assistant responses and supporting message retries.
- Invalidating or updating React Query caches when sessions change.
- Handling subscription-required responses with an upgrade dialog instead of exposing a raw API error.

React Query is used deliberately here. Chat history, sessions, and model data are server-owned state, so they benefit from query keys, stale times, cache lifetimes, retries, and targeted cache updates. For example, chat messages are cached by `['chat', sessionId]`, while the session list uses `['sessions']`. This keeps one conversation from accidentally sharing state with another.

### Memory and notes

Memory and notes are separate concepts in the product:

- **Memory** is context that can improve future AI conversations.
- **Notes** are user-managed content that can be created, reviewed, and deleted independently.

`src/hooks/useMemory.ts` and `src/hooks/useNotes.ts` keep the API integration close to the feature while `src/pages/Memory.tsx` and `src/pages/Notes.tsx` focus on presentation and user actions. The chat experience can also load memory context and add useful responses to notes through dedicated components such as `MemorySidebar`, `AddMemoryButton`, and `AddToNotesButton`.

### Onboarding

The onboarding flow is coordinated by `src/contexts/OnboardingContext.tsx` and rendered by `src/components/Onboarding.tsx`.

A user is treated as new when they have neither saved memories nor an active subscription, unless a completion flag already exists for that user. The checks for memory and subscription status are performed in parallel. The flow then guides the user through the product’s initial setup, including memory or notes, subscription selection, and model selection.

The intent is to make the first session useful without forcing returning users through setup again.

### UI system and responsive design

The UI is built with Tailwind CSS, Radix primitives, and shadcn-style components. Reusable primitives live under `src/components/ui`, while product-specific components live directly under `src/components`.

The design system includes:

- Shared button, dialog, form, sidebar, toast, input, card, table, and navigation primitives.
- Semantic theme tokens such as `background`, `foreground`, `primary`, `muted`, `card`, and `sidebar`.
- Provider-specific AI colors for model identification.
- Light, dark, and system theme support.
- Responsive layouts and mobile touch targets.
- Streaming, loading, empty, error, and upgrade states.
- Small motion details for chat bubbles, onboarding, and page transitions.

`src/components/Layout.tsx` provides the application shell and sidebar behavior, while `src/index.css` contains global styles and mobile optimizations such as dynamic viewport sizing and safe-area padding.

## Repository structure

```text
.
├── public/                         Static assets, logos, robots.txt, sitemap, security.txt
├── src/
│   ├── components/                 Product components and application shell
│   │   └── ui/                     Reusable Radix/shadcn-style primitives
│   ├── contexts/                   Auth, onboarding, and theme providers
│   ├── hooks/                      Feature integrations and server-state behavior
│   ├── lib/                        API configuration, formatting, and class utilities
│   ├── pages/                      Route-level screens for each product area
│   ├── App.tsx                     Providers and application routes
│   ├── main.tsx                    React entry point
│   ├── index.css                   Global design tokens and responsive styles
│   └── supabaseClient.ts           Supabase client configuration
├── index.html                      Metadata, SEO tags, and application root
├── package.json                    Scripts and dependencies
├── tailwind.config.ts              Theme tokens, animations, and Tailwind configuration
├── vite.config.ts                  Vite and React configuration
├── vercel.json                     Vercel deployment configuration
├── ONBOARDING_IMPLEMENTATION.md    Detailed onboarding implementation notes
└── FRONTEND_IMPLEMENTATION_COMPLETE.md  Frontend implementation notes
```

## Main product areas

The route tree in `src/App.tsx` reflects the major parts of the application:

| Route | Purpose |
| --- | --- |
| `/` | Entry page and recent chat sessions |
| `/auth` | Sign up, sign in, email verification, password reset, and Google OAuth |
| `/chat` | Multi-model chat with streaming responses and memory access |
| `/models` | Browse available models and provider information |
| `/notes` | Create and manage personal notes |
| `/sessions` | Manage saved chat sessions |
| `/memory` | Review and manage persistent memories |
| `/exports` | Manage exported APIs and integrations |
| `/usage` | Review usage information |
| `/billing` | Subscription and billing experience |
| `/connected` | Connected services and integrations |
| `/settings` | User preferences and application settings |
| `/overall-analytics` | Account-level analytics |
| `/api-analytics/:id` | Analytics for an exported API |
| `/onboarding/model-selection` | Initial model selection during onboarding |

## Engineering decisions

### Keep product behavior in hooks and contexts

Pages should primarily compose the experience. The reusable behavior belongs in hooks and contexts so it can be shared by multiple screens and tested or changed without rewriting the UI.

Examples include `useChat`, `useChatSessions`, `useModels`, `useMemory`, `useNotes`, and `usePayment`.

### Treat server state differently from local UI state

React Query manages data that comes from the API. Local React state manages transient interface concerns such as the current input, open dialogs, selected model, loading animations, and the memory sidebar. This separation makes it easier to reason about cache invalidation and avoids unnecessary global state.

### Optimize the perceived speed of chat

The chat interface adds the user message immediately, creates a temporary assistant message, and fills that message as stream chunks arrive. This makes the product feel responsive while still preserving the server as the source of truth.

### Make model choice explicit

Models are fetched from the API rather than hard-coded into the page. The frontend derives provider labels, colors, free-model status, pricing, and context length from the model metadata. If a user has no configured default model, the application falls back to an available free model.

### Handle failure as part of the user experience

The frontend distinguishes between ordinary request failures and subscription-related responses. Failed messages can be retried, network/API errors are surfaced through toasts, and subscription limitations lead to an upgrade path. Loading and empty states are also treated as first-class UI states throughout the product.

## Tech stack

- **TypeScript** — application language
- **React 18** — component model and UI runtime
- **Vite** — development server and production bundler
- **React Router** — client-side routing
- **TanStack React Query** — server-state caching, mutations, retries, and invalidation
- **Supabase** — authentication and session management
- **Tailwind CSS** — styling and responsive layout
- **Radix UI / shadcn-style components** — accessible, composable UI primitives
- **React Hook Form and Zod** — form handling and validation support
- **Lucide React** — interface icons
- **Recharts** — analytics visualizations

## Getting started

### Requirements

- Node.js 18 or newer
- npm, or Bun if you prefer to use the included `bun.lockb`
- A running Thryve API service
- A Supabase project configured for authentication

### Install and run locally

```bash
git clone https://github.com/InnovateTechWorld/THRYVECHAT.git
cd THRYVECHAT
npm install
npm run dev
```

Vite runs the development server on port `8080` according to `vite.config.ts`.

### Available scripts

```bash
npm run dev          # Start the Vite development server
npm run build        # Create a production build
npm run build:dev    # Create a development-mode build
npm run preview      # Preview the production build locally
npm run lint         # Run ESLint
```

## Environment variables

Create a `.env.local` file in the project root. The frontend reads the following values through Vite:

```bash
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`VITE_API_URL` defaults to `http://localhost:3000` when it is not set. The API is expected to provide authenticated endpoints for chat, sessions, models, memory, notes, payment/subscription status, usage, exports, and related features.

The frontend sends the current Supabase access token as a bearer token on API requests:

```text
Authorization: Bearer <supabase-access-token>
```

Do not commit real credentials or private service-role keys. Only the public Supabase client configuration belongs in the browser application.

## API integration

The API base URL is centralized in `src/lib/api.ts`. Feature hooks then build on that shared value. The current frontend expects endpoints in these general groups:

```text
GET    /chat/history/:sessionId
POST   /chat/message
GET    /chat/sessions
POST   /chat/sessions
PATCH  /chat/sessions/:sessionId
DELETE /chat/sessions/:sessionId

GET    /models
GET    /memory
POST   /memory
DELETE /memory/:id

GET    /notes
POST   /notes
DELETE /notes/:id

GET    /api/payment/dashboard-complete
```

The chat message endpoint should return a streaming response using `data: ...` events and finish with a `data: [DONE]` marker. The frontend parses streamed JSON chunks and appends `content` to the active assistant message.

## Deployment

The project is configured as a Vite frontend and includes `vercel.json` for deployment configuration. A typical production deployment is:

1. Import the repository into Vercel.
2. Set the production values for `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
3. Build with `npm run build`.
4. Deploy the generated Vite output.
5. Confirm that Supabase redirect URLs and the API CORS configuration include the deployed domain.

The application metadata currently identifies the product as **Thryve — Multi-model AI Conversations with Memory** and includes Open Graph, Twitter, canonical URL, sitemap, robots, and structured-data support.

## Working on the code

When adding a feature, a good default approach is:

1. Add or update the API integration in a focused hook under `src/hooks`.
2. Define the local types close to the feature boundary.
3. Use React Query for API-owned data and cache updates.
4. Add reusable UI behavior to `src/components` rather than duplicating it across pages.
5. Reuse primitives from `src/components/ui` for consistent interaction and accessibility.
6. Add the route in `src/App.tsx` and protect it when authentication is required.
7. Include loading, empty, error, mobile, and subscription states where relevant.
8. Run linting and a production build before opening a pull request.

## Current scope and future direction

Thryve already has the foundation for a broader AI workspace: model choice, memory, notes, exports, analytics, billing, and connected services all live within the same application shell.

Natural next steps include deeper automated testing, stronger runtime validation for API responses, more explicit API type generation, improved observability around streaming failures, and additional personalization around memory and model selection.

## License

No open-source license has been added to this repository yet. Until a license is provided, the code should be treated as proprietary and used according to the repository owner's permissions.
