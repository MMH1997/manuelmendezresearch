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
