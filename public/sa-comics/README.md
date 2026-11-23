Interactive comics embedded (via `<iframe>`) in strips 578 and 580, recovered
from the Wayback Machine (captures from 2018–2024).

Changes from the archived files:

- `578/scripts/main.js`, `578/scripts/login_scripts/main.js`, `580/scripts/main.js`:
  Chrome/Opera were served `PointerLockControlsChrome.js`, which was never
  archived; all browsers now use `PointerLockControls.js`.
- `578/scripts/login_scripts/login.js`: the "[sudo] password for basilisk"
  stage posted to a server-side `verify.php` that could not be recovered (only a
  parked-domain page was archived), so any password is now accepted.
- `578/scripts/login.php` renamed to `login.html` (it's static HTML; GitHub
  Pages wouldn't serve `.php` as a page), with the references in
  `578/scripts/graph.js` and the page's own form `action` updated.
- Not included: `578/scripts/verify.php` and `578/scripts/login.js`, which were
  parked-domain pages, not the original files.
