# نتعرف بيك – Funny Quiz App

A light-hearted Arabic RTL quiz app built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output is in `dist/`.

## Deploy to GitHub Pages

1. Create a repo (e.g. `quiz-a`) and push this project.
2. In `package.json`, set `homepage` to your GitHub Pages URL, e.g.  
   `"homepage": "https://YOUR_USERNAME.github.io/quiz-a/"`
3. In `vite.config.ts`, set `base` to match: `base: '/quiz-a/'`
4. Run:

```bash
npm run deploy
```

This builds and pushes the `dist` folder to the `gh-pages` branch. Enable GitHub Pages in the repo settings to use that branch.

## Quiz area assets

- **Sound:** Add `million-dollars.mp3` in `public/sounds/` to play the "Who will win the million dollars" effect when the quiz loads.
- **Memes:** Add images in `public/memes/` (e.g. `exam1.jpg`–`exam12.jpg`) to show your own meme images; otherwise placeholder images are used.

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Framer Motion (modals and transitions)
- RTL and Arabic font (Cairo)
