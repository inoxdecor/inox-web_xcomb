# INOX Aluminium Honeycomb — standalone website

This folder is a static HTML/CSS/JavaScript website intended for **https://xcomb.inoxdecor.com**. It has no framework, build step, runtime package dependencies, database, API, external font service or CDN dependency. The parent INOX project is not needed. Node.js is used only for the optional local preview and checks.

## Preview and checks

From this folder, run:

```powershell
npm run dev
```

Open **http://127.0.0.1:4175/**. Do not open `index.html` using `file://`. No `npm install` or `npm run build` is needed. To use a different port in PowerShell:

```powershell
$env:PORT = '4177'
npm run dev
```

Run `npm run check` to verify the referenced local assets, internal anchor targets, standalone paths, duplicate HTML IDs, and the syntax of loaded JavaScript and the preview server. **No linter is configured.** This check does not replace browser testing.

## Repository and static hosting

Keep these at the root of a separate GitHub repository:

```text
index.html
assets/
package.json
preview.mjs
scripts/check.mjs
README.md
.gitignore
```

Include the complete `assets/` directory and its attribution/license files. Exclude `node_modules/`, `dist/`, `tmp/`, `.env*` and Git internals from a file-upload deployment; the project ignore rules already exclude the first four from Git. `tmp/static-repair/` holds local QA artifacts and a backup of the superseded React work; it is not part of the website.

For a Git-connected static host, leave the build command empty and set the publish directory to **`.`** (repository root). For a file-upload host, place `index.html` and the entire `assets/` directory in the document root assigned to **xcomb.inoxdecor.com**. There is no server application to start in production. The preview server is for local use only.

Assets use root-relative `/assets/` URLs. Serve this site at the root of the subdomain; a default GitHub Pages `/repository-name/` URL is not the intended layout. The hostname and HTTPS must be configured in the hosting account separately. This work has not pushed a repository, deployed a site, or changed DNS.

## Maintained implementation

- `index.html`: original photograph hero, navigation, panel study, layer reveal, cabinet construction, advantages, applications, finishes, enquiry and footer.
- `assets/fonts.css`, `base.css`, `studio.css`, `headings.css`: existing local fonts, branding, layout and typography.
- `assets/panel-cinematic.*`: automatic edge-closure and core-detail study, using the existing local illustration. The panel stays on the right on desktop, with its text always visible. A six-second forward animation holds for one second, reverses, holds again, and repeats. It pauses off-screen, in a hidden tab, or via the Pause animation control. Selecting a material detail pauses at that pose; Play animation resumes the loop. There is no scroll pin for this section. Reduced motion keeps the static presentation; phones stack the illustration above the text, with compact spacing below 700px.
- `assets/honeycomb-config.js` and `honeycomb-reveal.*`: the existing three-layer SVG artwork assembles/explodes with reversible scrolling. Desktop uses a pinned study; phones reveal the layers as the section enters, without pin spacing. The buttons seek the same scroll positions. Reduced motion and viewports under 620px high retain manual view controls without pinning.
- `assets/cabinet-scroll.*`: existing projected cabinet shutter opening, with a stable cabinet body. Viewports too short to fit the workbench show the open cabinet directly.
- `assets/mobile.css`: content-sized phone hero and panel study, consistent section spacing, readable controls and form inputs, and constrained finish grids. Mobile cabinet scrolling is limited to 320px, anchored just below the header, with descriptions readable throughout. The source shutter is scaled before its first frame to avoid temporary viewport expansion. Mobile scroll distances use the layout viewport height, and address-bar-only resizes do not rebuild ScrollTriggers. Decorative entrance reveals are desktop-only; the phone panel loop still plays automatically.
- `assets/studio.js`: menu, cabinet part selection, application preselection, finish inspiration and email-draft form. Decorative animations respect live reduced-motion changes; there is no perpetual product-bobbing loop.

The fully exploded layers, open cabinet, descriptions and contact links remain readable without JavaScript or the animation libraries. Without JavaScript the navigation stays visible, the header sits in normal page flow, and the form button remains disabled with direct email/phone links provided. Keep the active script order in `index.html`; load each script once. The three material/cabinet modules also clean up previous instances if reinitialized. Browser back/forward cache retains the existing document and animation layout.

No image assets or font files were replaced in this repair. Existing warranty/product copy was retained, with its existing request to confirm actual warranty terms. No new dimensions, certifications or product specifications were added. Finish tones remain labelled as inspiration rather than an actual finish catalogue.

## Differences from the parent reference

The inspected `D:\INOX\INOX-web\public\honeycomb\` is an older implementation. It uses a single panel image with `.rev`/`.ex` scroll transforms and does not contain the standalone copy's edge-closure module, separate SVG layers, heading stylesheet, or animated cabinet module. Its `/honeycomb/assets/` and `/media/editorial/` paths also depend on the parent site's routing.

The standalone Git version preserved the newer imagery and typography, but its layer reveal had become button-only. This repair uses that newer standalone version as the baseline and adds scroll-driven poses to its actual layers rather than copying the older parent page. Two swapped application captions were corrected to match their photographs and enquiry values. The parent project was read as a reference and was not modified. Do not overwrite this folder using the parent's old static export script.

## Enquiry behavior

The form validates a name, phone or email, and consent, then opens a `mailto:` draft to **info@inoxdecor.com**. The visitor must review and send it using their email app. The site does not submit or store an enquiry, and it does not claim delivery. A configured mail application is needed; direct email and telephone links are also available.

## Browser verification

Local Chrome checks cover desktop, mobile, tablet and landscape layouts; forward and reverse scroll poses; menu and anchor behavior; application selection; form validation and mail-draft generation without sending; live reduced motion; script reinitialization; resizing; readable no-JavaScript content; local asset responses and JavaScript errors. Screenshots and detailed results are retained in ignored `tmp/static-repair/`.

Browser checks use a local development tool and are not a deployed runtime dependency. Real-device Safari/Firefox behavior, an installed email client, DNS, HTTPS and the live target hostname have not been verified here.
