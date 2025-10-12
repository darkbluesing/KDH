# GEMINI Project Analysis: KDH

## 1. Project Overview

This repository contains a monorepo with two primary components:

1.  **`frontend`**: A Next.js web application called the **K-POP Demon Hunters Shorts Hub**. This application serves as a media hub, aggregating short-form video content from YouTube and Instagram related to the "K-POP Demon Hunters" fictional universe. It features a dynamic video grid, audio player, and advertising components.
2.  **`task-master`**: A sophisticated command-line interface (CLI) tool designed for agentic software development. It parses product requirement documents (PRDs), generates and manages development tasks, analyzes complexity, and integrates with various AI models to streamline the entire development lifecycle.

The overall workflow is designed for development to be orchestrated by the `task-master` agent, which manages the implementation of the `frontend` application.

---

## 2. Frontend Application: K-POP Demon Hunters Shorts Hub

This is the user-facing web application.

### Key Technologies

*   **Framework**: Next.js (with App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS with a custom theme defined in `tailwind.config.ts` and `src/styles/design-tokens.ts`.
*   **UI/Animation**: Framer Motion, React Icons

### Building and Running

To run the frontend application locally:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Other Key Scripts

*   **Build for production:** `npm run build`
*   **Start production server:** `npm run start`
*   **Lint files:** `npm run lint`
*   **Format code:** `npm run format`

### Key Directories (`frontend/src`)

*   `app/`: Contains the main application routes, layouts, and pages (using Next.js App Router).
*   `components/`: Reusable React components (e.g., `VideoGrid`, `AdModal`).
*   `hooks/`: Custom React hooks for shared logic (e.g., `useModalState`).
*   `lib/`: Core utilities, type definitions (`types.ts`), and mock data.
*   `services/`: Logic for interacting with external APIs like the YouTube Data API.
*   `styles/`: Global styles and design token definitions.

### Environment Variables

Create a `.env.local` file inside the `frontend` directory by copying `.env.example`. This file is required for API integration.

*   `YOUTUBE_API_KEY`: Required for fetching videos from YouTube.
*   `YOUTUBE_CHANNEL_ID` or `YOUTUBE_SEARCH_QUERY`: To specify which videos to fetch.
*   `OPENAI_API_KEY` / `PERPLEXITY_API_KEY`: Required for AI-powered features.

---

## 3. Development Workflow: `task-master` CLI

This CLI tool orchestrates the development process. It is configured at the root of the project.

### Purpose

The `task-master` tool is used to automate and manage the software development lifecycle. Its capabilities include:
*   Parsing PRDs to automatically generate tasks.
*   Managing a hierarchical list of tasks and subtasks.
*   Analyzing task complexity using AI.
*   Integrating with AI models (like GPT, Claude, Perplexity) to assist in development.

### Key Commands

The CLI is operated via the `task-master` command.

*   **Initialize project:** `task-master init`
*   **Parse a PRD:** `task-master parse-prd <path_to_prd>`
*   **List all tasks:** `task-master list`
*   **Get the next available task:** `task-master next`
*   **Show task details:** `task-master show <task_id>`
*   **Update task status:** `task-master set-status --id=<id> --status=<status>`

### Configuration

*   **`.taskmaster/config.json`**: Defines the AI models (e.g., from OpenAI, Perplexity) used by the agent for various roles (main, research, fallback).
*   **`.env` (root level)**: An environment file at the project root is required to store API keys (`OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, etc.) for the `task-master` CLI to function correctly.
