# 🎬 CINEVERSE — Movie Discovery & Review Platform

**Discover films. Build your watchlist. Share your reviews.**

CINEVERSE is a modern, responsive movie discovery platform powered by the TMDB API. Explore trending movies, discover popular films, search by genre, maintain your personal watchlist, and share movie reviews through a clean editorial-style interface.

## ✨ Features

- 🔥 **Trending Movies** — Discover currently trending films.
- 🎥 **Popular Movies** — Explore popular movie collections.
- ⭐ **Top Rated Movies** — Find highly rated movies.
- 🔍 **Movie Search** — Search movies by title.
- 🎭 **Genre Filtering** — Explore movies by genre.
- 📖 **Movie Details** — View movie information and ratings.
- ❤️ **Personal Watchlist** — Save and manage favourite movies.
- 👤 **User Accounts** — Register, sign in and sign out.
- ✍️ **Movie Reviews** — Write and update personal reviews.
- 📊 **Personal Profile** — View saved movies and reviews.
- 📱 **Responsive Design** — Works across desktop, tablet and mobile.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive UI |
| JavaScript | Application functionality |
| TMDB API | Movie data and posters |
| LocalStorage | Local user data and watchlists |
| GitHub Pages | Website hosting |

## 🚀 Live Demo

**[Visit CINEVERSE](https://YOUR-GITHUB-USERNAME.github.io/CINEVERSE/)**

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-GITHUB-USERNAME/CINEVERSE.git
```

### 2. Open the Project

```bash
cd CINEVERSE
```

### 3. Configure TMDB API

1. Create an account at [The Movie Database](https://www.themoviedb.org/).
2. Visit [TMDB API Settings](https://www.themoviedb.org/settings/api).
3. Generate your API key.
4. Open `config.js`.
5. Add your TMDB API key:

```javascript
window.CINEVERSE_CONFIG = {
    TMDB_API_KEY: "YOUR_TMDB_API_KEY"
};
```

### 4. Run Locally

Open the project in VS Code and use the Live Server extension.

Alternatively:

```bash
python -m http.server 5500
```

Visit `http://localhost:5500` in your browser.

## 🌐 GitHub Pages Deployment

1. Push the project to your GitHub repository.
2. Navigate to **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Choose the `main` branch.
5. Select the `/ (root)` folder.
6. Click **Save**.

Your website will be published using GitHub Pages.

## 📁 Project Structure

```text
CINEVERSE/
│
├── index.html
├── config.js
├── README.md
│
└── assets/
    ├── app.js
    └── style.css
```

## 🔐 Data Storage & Privacy

CINEVERSE uses browser LocalStorage to store account information, login state, watchlists and reviews.

- Data remains in the visitor's browser.
- Information does not automatically sync across devices.
- Clearing browser storage can remove saved information.
- This is a frontend demonstration, not production-grade authentication.

For secure authentication and shared user data, a backend or Firebase integration would be required.

**API Key Notice:** Never commit a private API credential to a public repository. TMDB frontend API keys are visible to visitors, so use appropriate API restrictions and rotate an exposed key if necessary.

## 🎬 Movie Data & Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

Movie information and images are provided by [The Movie Database (TMDB)](https://www.themoviedb.org/).

API Documentation: https://developer.themoviedb.org/docs

## 👨‍💻 Developer

**Suryansh Sharma**

- GitHub: [@Offx-suryansh](https://github.com/Offx-suryansh)
- Portfolio: [suryanshsharma.runs-at.dev](https://suryanshsharma.runs-at.dev/)

---

<p align="center">
  Made with ❤️ for movie lovers.
  <br>
  <strong>CINEVERSE © 2026</strong>
</p>