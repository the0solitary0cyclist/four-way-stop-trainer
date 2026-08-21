# 4-Way Stop Trainer

A React + TypeScript/Vite app for practicing right-of-way decisions at a U.S. four-way stop.

## Features

- Random scenarios with 2–4 cars
- Animated arrivals at the intersection in scenario order
- Click cars to rank who should proceed 1st, 2nd, 3rd, and 4th
- Correct-answer feedback and score tracking
- Overhead car graphics with wheels, windows, roof, hood, and trunk
- Direction arrows that point in **map coordinates** to the car's intended destination
- Static rules page built into the app

## Direction-arrow behavior

The arrow on each car indicates where that car will move on the diagram, not merely a generic turn symbol.

Examples:

- Car approaching from the north and going straight: ↓
- Car approaching from the east and turning right: ↑
- Car approaching from the west and turning left: ↑
- Car approaching from the south and going straight: ↑

The mapping is defined in `src/App.tsx` as `ARROW_FOR_MOVEMENT`.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Main files

- `src/App.tsx` — UI, animation, scoring, navigation, arrow mapping
- `src/scenarios.ts` — randomized scenario generation and right-of-way logic
- `src/styles.css` — intersection, overhead cars, and animation styling
- `src/types.ts` — shared TypeScript types

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml` for automatic deployment.

1. Create a GitHub repository named `four-way-stop-trainer`.
2. Push this project to the repository's `main` branch.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **GitHub Actions**.
5. Push to `main` (or manually run the **Deploy to GitHub Pages** workflow from the Actions tab).

The default Vite production base path is `/four-way-stop-trainer/`, matching that repository name.
If you use a different repository name, edit `vite.config.ts` accordingly, or set the `VITE_BASE_PATH` environment variable during the build.
