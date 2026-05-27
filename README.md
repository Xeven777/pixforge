# PixForge

PixForge is a cross-platform desktop app for fast, local image and video processing — no uploads, no cloud, no subscriptions. It bundles the everyday media tasks you'd otherwise scatter across half a dozen websites into a single native app.

## Features

- **Image Compress** — shrink JPEG / PNG / WebP files with adjustable quality, preserving as much fidelity as possible.
- **Format Convert** — convert between common image formats (JPEG, PNG, WebP, and more) in batch.
- **Video Tools** — trim, convert, and re-encode video via a bundled FFmpeg pipeline.
- **Presets** — save your favorite quality / format combinations for one-click reuse.
- **Local-first** — all processing happens on your machine; files never leave your computer.

## Why PixForge

Web tools rate-limit you, watermark your output, or send your files through someone else's server. Native tools are usually either bloated or single-purpose. PixForge is small, fast, offline, and does the handful of things most people actually need.

## Built With

A desktop app built with Tauri, React, TypeScript, and Tailwind CSS. Heavy lifting is done in Rust (image crate + FFmpeg) so the UI stays responsive even on large batches.

## Tech Stack

- **Tauri 2** — native desktop shell (Rust)
- **React 18** + **React Router**
- **TypeScript**
- **Vite** — dev server and build
- **Tailwind CSS**

## Prerequisites

- [Node.js](https://nodejs.org/) (18+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Platform-specific Tauri dependencies — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

## Getting Started

```bash
npm install
npm run tauri dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server (web only) |
| `npm run build` | Type-check and build the frontend |
| `npm run preview` | Preview the built frontend |
| `npm run tauri dev` | Run the Tauri desktop app in dev mode |
| `npm run tauri build` | Build the production desktop binary |

## Project Structure

```
src/          React frontend
src-tauri/    Tauri (Rust) backend
```
