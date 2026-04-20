# Abstruse Goose Mirror

I'm a fan of [Abstruse Goose](https://abstrusegoose.com/), and I wanted to have
it back and easily reachable. That's why I set this site up.

It's based on pages I pulled from the [Wayback Machine (Internet
Archive)](https://web.archive.org/web/*/abstrusegoose.com). All credit for the
comics goes to the original author; this is just a personal mirror so the
strips stay reachable.

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
