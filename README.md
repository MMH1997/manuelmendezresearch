# Manuel Méndez Hurtado — Academic Website

Static multi-page academic website for GitHub Pages.

## Files
- `index.html`: homepage and short personal introduction
- `research.html`: research directions
- `publications.html`: selected publications and Google Scholar link
- `teaching.html`: teaching and supervision
- `projects.html`: research projects
- `awards.html`: academic awards and certificates
- `contact.html`: contact details and academic profiles
- `styles.css`: shared styling
- `script.js`: mobile navigation and footer year
- `citations.js`: Google Scholar metrics widget (reads `data/citations.json`)
- `scripts/update_citations.py` and `.github/workflows/update-citations.yml`: daily job that refreshes `data/citations.json`
- `assets/`: portrait and award images

## Publish on GitHub Pages
1. Upload all files and the `assets` folder to the root of the repository.
2. Keep the repository's Pages setting on `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Commit the changes and wait for deployment.

The site uses relative links, so it works under the repository URL:
`https://mmh1997.github.io/manuelmendezresearch/`

## Image filenames
The HTML expects:
- `assets/manuel-mendez-hurtado.jpg`
- `assets/Captura de pantalla 2026-10-26 014344.png`
- `assets/ACIIDS2022_BestPaperAward.jpg`

Keep those filenames exactly, or update the corresponding `src` and `href` attributes in the HTML.

## Google Scholar widget
The widget on the home page and on Publications shows citations, h-index, i10-index and citations per year.
A GitHub Action (`Update Google Scholar citations`) runs every day, reads the public Scholar profile and commits `data/citations.json`.
You can also run it by hand from the **Actions** tab (**Run workflow**).
If Google blocks the request, add a free SerpApi key as a repository secret named `SERPAPI_KEY` (Settings → Secrets and variables → Actions) and the job uses it as a fallback.
Until `data/citations.json` exists, the widget stays hidden.
