# Abstruse Goose Mirror

I'm a fan of [Abstruse Goose](https://abstrusegoose.com/), and I wanted to have
it back and easily reachable. That's why I set this site up.

It's based on pages I pulled from the [Wayback Machine (Internet
Archive)](https://web.archive.org/web/*/abstrusegoose.com). All credit for the
comics goes to the original author; this is just a personal mirror so the
strips stay reachable.

## Changes from the original

- The retrieved copy of the original has been reversed engineered to extract images, titles, alt text, links, blog text, styles, etc. A new React based app has been created based on that. So in a sense this mirror is not a true mirror.
- The original "privacy" page has been replaced with "about this mirror" page since there's no useful info about privacy (this mirror doesn't have any tracking or 3rd party tools).
- The original "store" link (that led to a defunct store page) has been replaced with "report an issue" link leading to new GitHub issue page.
- Minor encoding fixes.
- All links have been changed from "http://" to "https://".

## Development

```sh
pnpm install
pnpm dev
```

To regenerate `src/strips.json` from the raw HTML pages under
`raw/abstrusegoose.com/`:

```sh
pnpm parse-pages
```
