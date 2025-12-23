# CASA Dashboard v2 - Light Theme

A modern React dashboard for INAD (Inadmissible Passengers) analysis with a clean, bright design inspired by Prodify.

![Preview](preview.png)

## ✨ Features

### Design
- **Bright Theme**: Light purple/lavender background with white cards
- **Dark Text**: Black and dark gray text for excellent readability
- **Modern UI**: Rounded corners, subtle shadows, clean typography
- **Glassmorphism**: Subtle glass-effect cards

### Functionality
- **3D Globe Visualization**: Interactive route map with react-globe.gl
- **Multi-language Support**: English, German, and French
- **Semester Selector**: Quick switching between reporting periods
- **Chart Controls**: Fullscreen view and PNG download for all charts
- **Priority Classification**: High Priority, Watch List, Clear, Unreliable
- **Systemic Case Detection**: Track recurring issues across semesters
- **Export Capabilities**: CSV export for routes data

### Navigation (Streamlined)
- Globe View
- Overview
- Airlines
- Priority Analysis
- Systemic Cases
- Legal Summary

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Download from https://nodejs.org)

### Installation

```bash
# 1. Extract the zip file and navigate to the folder
cd casa-react-v2

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

The app will open at http://localhost:3000

### Production Build

```bash
npm run build
```

This creates an optimized `build/` folder ready for deployment.

## 📁 Project Structure

```
casa-react-v2/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx     # Navigation + semester + language
│   │   ├── StatCard.jsx    # Metric cards
│   │   ├── GlobeView.jsx   # 3D globe with controls
│   │   ├── RoutesTable.jsx # Sortable data table
│   │   └── ChartContainer.jsx # Wrapper with fullscreen/download
│   ├── pages/
│   │   └── Dashboard.jsx   # Main page with all tabs
│   ├── data/
│   │   ├── sampleData.js   # Demo route data
│   │   └── translations.js # EN/DE/FR translations
│   ├── styles/
│   │   └── globals.css     # Complete design system
│   ├── App.jsx             # Root component
│   └── index.js            # Entry point
├── preview.html            # Standalone design preview
├── package.json
└── README.md
```

## 🎨 Design System

### Colors
```css
--color-primary: #7C3AED;      /* Purple */
--color-danger: #EF4444;       /* Red - High Priority */
--color-warning: #F59E0B;      /* Orange - Watch List */
--color-success: #10B981;      /* Green - Clear */
--bg-primary: #F5F3FF;         /* Lavender background */
--bg-secondary: #FFFFFF;       /* White cards */
--text-primary: #111827;       /* Near-black text */
--text-secondary: #4B5563;     /* Dark gray text */
```

### Components
- **Cards**: White background, 1px border, 14px radius
- **Buttons**: Primary (purple), Secondary (white with border)
- **Badges**: Colored backgrounds with matching text
- **Tables**: Striped hover, sortable headers

## 🌍 Multi-Language Support

The dashboard supports three languages:
- **English** (EN) - Default
- **German** (DE) - Deutsch
- **French** (FR) - Français

Switch languages using the selector at the bottom of the sidebar.

## 📊 Chart Features

Every chart and graph includes:
- **Fullscreen button** (⛶): Expand to full screen for presentations
- **Download button** (⬇): Save as PNG image
- **Close button** (✕): Exit fullscreen mode

Uses `html2canvas` for PNG generation.

## 🔧 Configuration

### Connecting to Backend API

Create `src/services/api.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const fetchRoutes = async (semester) => {
  const response = await fetch(`${API_URL}/routes?semester=${semester}`);
  return response.json();
};

export const fetchSummary = async (semester) => {
  const response = await fetch(`${API_URL}/summary?semester=${semester}`);
  return response.json();
};
```

Update Dashboard.jsx to use the API:

```javascript
import { fetchRoutes, fetchSummary } from '../services/api';

// In your component:
useEffect(() => {
  fetchRoutes(semester).then(setRoutes);
  fetchSummary(semester).then(setSummary);
}, [semester]);
```

### Environment Variables

Create `.env` file:

```
REACT_APP_API_URL=https://your-api.com
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
1. Run `npm run build`
2. Upload `build/` folder to Netlify

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

## 📱 Responsive Design

- **Desktop**: Full sidebar (260px) + main content
- **Tablet**: Collapsed sidebar (icons only)
- **Mobile**: Hidden sidebar with hamburger menu

## 🔒 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support for 3D globe rendering.

## 📄 License

MIT License - Free for commercial and personal use.

## 🆘 Troubleshooting

### Globe not rendering
- Check WebGL support: https://get.webgl.org/
- Try a different browser
- Ensure stable internet for texture loading

### Fonts not loading
- Check internet connection (uses Google Fonts CDN)
- Add fallback fonts in CSS

### Download PNG not working
- html2canvas requires CORS-enabled images
- Check browser console for errors

---

Built with ❤️ using React, react-globe.gl, and Lucide icons.
