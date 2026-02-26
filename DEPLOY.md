# Deploy to GitHub Pages

## One-time setup

1. **Create a GitHub repo** (e.g. `quiz-a`). Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/quiz-a.git
   git push -u origin main
   ```

2. **Repo name and Vite base**  
   The app is configured for a repo named **quiz-a** (`base: '/quiz-a/'` in `vite.config.ts`).  
   If your repo has a different name (e.g. `marriage-quiz`), change both:
   - `vite.config.ts` → `base: '/marriage-quiz/'`
   - Your live URL will be `https://YOUR_USERNAME.github.io/marriage-quiz/`

3. **Keep `.env` local**  
   `.env` is in `.gitignore`. Do **not** commit it.  
   Before each deploy, run `npm run build` on your machine (where `.env` exists). The build will bake your EmailJS keys into the app, and `npm run deploy` will upload that built `dist/` to GitHub Pages.

## Deploy (every time you want to go live)

From the project root, with a valid `.env`:

```bash
npm run deploy
```

This will:

1. Run `npm run build` (TypeScript + Vite build).
2. Push the `dist/` folder to the `gh-pages` branch of your repo.

## Enable GitHub Pages

1. On GitHub: **Your repo** → **Settings** → **Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Branch: **gh-pages** (or **main** if you use that for the built site).
4. Folder: **/ (root)**.
5. Save. After a minute or two, the site will be at:

   **https://YOUR_GITHUB_USERNAME.github.io/quiz-a/**

(Replace `YOUR_GITHUB_USERNAME` and `quiz-a` with your GitHub username and repo name.)

## After deploy

- EmailJS will work on the live site because the `VITE_*` values were included in the build when you ran `npm run deploy` on your machine (where `.env` exists).
- To change keys later: update `.env` locally, run `npm run deploy` again.
