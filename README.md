# Personal website

A small static site: no build step, no dependencies. Plain HTML, CSS and JS, ready for GitHub Pages.

## Put it online

1. On GitHub, create a **public** repo named `<your-username>.github.io`.
2. From this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```
3. In the repo go to **Settings > Pages**, set the source to **Deploy from a branch**, choose `main` and `/ (root)`.
4. After a minute your site is live at `https://<your-username>.github.io`.

To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.

## What to edit

| What | Where |
| --- | --- |
| Name, bio, interests, links, contact | `index.html` (search for `Your Name`) |
| Projects, categories, greetings | top of `main.js` |
| Colours and fonts | the variables at the top of `style.css` |
| Profile picture | replace `img/profile.svg` (or point the `<img>` to a `.jpg`) |
| CV and other documents | drop PDFs in the root, e.g. `cv.pdf` |

## Adding a project

Add an object to `PROJECTS` in `main.js`:

```js
{ title: 'My thing', blurb: 'One line.', year: 2026, cats: ['dev'], tags: ['personal', 'mini'], href: 'projects/my-thing.html', featured: true }
```

- `featured: true` shows it on the home page.
- Tag it `mini` for interactive projects.
- Each project can link to its own page (copy `projects.html` as a starting point) or to an outside site.

## Features

- Headlines rise out of a clipped line, paragraphs fade in word by word, and project rows slide in from the left (modelled on palash.fyi)
- A custom dot cursor that grows over links (mouse users only; delete the cursor block in `main.js` to remove it)
- Page fade transition between pages (turned off if the visitor prefers reduced motion)
- Light and dark theme, remembered between visits
- Click the greeting on the home page to cycle languages
- Projects page filters by category and tag, and the filter lives in the URL so it can be shared
