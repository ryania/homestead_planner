# Homestead Planner

A browser-based interactive design tool for planning and visualizing homestead layouts. Place trees, structures, fences, water features, paths, and garden beds on a scaled canvas — with smart plant spacing validation built in.

## Features

- **7 drawing tools** — structures, trees/plants, fences, paths, garden beds, and water features
- **Smart spacing rings** — each tree displays its mature spread; rings turn red when trees overlap
- **Plant database** — 60+ curated varieties with spacing, hardiness zones, and pollination data
- **Online plant search** — optional Trefle.io API integration for extended plant lookup
- **Chicken flock manager** — track individual birds by breed, hatch date, and role
- **Configurable scale** — set how many feet each grid square represents
- **Save & load** — export/import designs as `.json` files
- **Autosave** — browser localStorage backup every 2 minutes
- **Dark theme UI** — left toolbar, right properties panel, footer status bar

## Getting Started

No build step or server required. Just open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge).

```bash
# Clone the repository
git clone <repo-url>
cd homestead_planner

# Open in browser
open index.html       # macOS
xdg-open index.html   # Linux
start index.html      # Windows
```

Or serve it locally if you prefer:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Usage

### Tools & Keyboard Shortcuts

| Key | Tool |
|-----|------|
| `S` | Select / Move |
| `B` | Structure (buildings) |
| `T` | Tree / Plant |
| `F` | Fence |
| `W` | Water feature |
| `P` | Path |
| `G` | Garden bed |

### Navigation

| Action | How |
|--------|-----|
| Zoom in/out | Mouse wheel or `+` / `-` keys |
| Pan | `Alt` + click-drag, or middle mouse button |
| Fit to screen | Click the **Fit** button in the header |
| Select object | Click it with the Select tool |
| Move object | Drag with Select tool |
| Delete object | Select it, press `Delete` or `Backspace` |

### Adding Plants

1. Press `T` to switch to the Tree tool.
2. Click the canvas to open the plant browser.
3. Filter by category, self-fertility, or USDA hardiness zone.
4. Select a plant — a spacing ring appears showing its mature spread.
5. Rings turn red if two plants overlap (spacing conflict).

### Saving Your Design

- **Save** — click **Save** in the header to download a `.json` file.
- **Load** — click **Load** to restore a previously saved `.json` file.
- **Autosave** — the design is automatically saved to `localStorage` every 2 minutes when changes are made. You'll be prompted to restore it on the next visit.

## Configuration

Open **Settings** (gear icon) to configure:

| Setting | Description |
|---------|-------------|
| Trefle API key | Enables online plant search via [Trefle.io](https://trefle.io) (free tier available) |
| Default USDA zone | Pre-filters the plant browser to your hardiness zone |
| Canvas background | Change the canvas background color |
| Grid square size | Set how many feet one grid square represents (default: 5 ft) |

## Project Structure

```
homestead_planner/
├── index.html              # Entry point
├── style.css               # All styles (dark theme, layout)
├── data/
│   └── plants.json         # Plant database source data
└── js/
    ├── app.js              # Initialization
    ├── state.js            # Global state + event bus
    ├── canvas.js           # Fabric.js setup, zoom, pan, grid
    ├── toolbar.js          # Tool switching
    ├── scale.js            # Scale config + overlap detection
    ├── persistence.js      # Save/load/autosave
    ├── utils.js            # Helpers
    ├── entities/           # Drawable object classes
    │   ├── EntityBase.js
    │   ├── TreeEntity.js
    │   ├── StructureEntity.js
    │   ├── FenceEntity.js
    │   ├── PathEntity.js
    │   ├── BedEntity.js
    │   └── WaterEntity.js
    ├── tools/              # Tool implementations (one per tool)
    ├── db/                 # Plant database + Trefle.io integration
    └── panels/             # UI panels (plant browser, properties, chickens)
```

## Tech Stack

- **[Fabric.js](http://fabricjs.com/) 5.3.1** — canvas drawing and object manipulation
- **Vanilla JavaScript (ES6 modules)** — no framework, no build step
- **Native browser APIs** — LocalStorage, Fetch, CSS custom properties

## Design File Format

Designs are saved as `.json` with this structure:

```json
{
  "version": "1.0",
  "meta": { "name": "", "created": "", "modified": "" },
  "scale": { "pixelsPerFoot": 10, "gridSizeFt": 5, "showGrid": true, "showSpacingRings": true },
  "canvasConfig": { "width": 1600, "height": 1200, "backgroundColor": "#1a1a1a" },
  "entities": [],
  "chickens": [],
  "settings": {}
}
```

## License

MIT
