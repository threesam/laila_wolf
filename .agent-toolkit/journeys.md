# Journeys — lailawolf.com

Declared UX journeys for `/drive`. Every step must complete with no console or
network errors and the expected state present.

The site is two prerendered pages plus one dynamic endpoint. The journeys below
exist mainly to catch the failure that took the site down for a week in July
2026: a Sanity outage turning into a 500 on every page.

## 1. Homepage renders without Sanity at request time

1. Visit `/`
2. Expect the page title to be `Laila Wolf`
3. Expect the `<h1>` to contain `Laila` and `Wolf`
4. Expect the hero `<img>` to have a `src` on `cdn.sanity.io` with `w=1024`
5. Expect at least one social link in `#socials`
6. Expect the contact mailto link `contact@lailawolf.com`
7. Expect no request to `*.api.sanity.io` — the page is prerendered, so a live
   API call at request time is the regression this asserts against

## 2. About page renders

1. Visit `/about`
2. Expect the page title to contain `About`
3. Expect the founder image to render
4. Expect body copy to be present

## 3. Contact redirects to the socials section

1. Visit `/contact`
2. Expect a redirect to `/#socials`
3. Expect the socials section to be present on the resulting page

## 4. Subscribe form is reachable and dynamic

1. Visit `/`
2. Expect `#subscribe` to contain an email input and a submit button
3. Expect the submit button to be enabled
4. Do NOT submit — `/api/subscribe` posts to a live mailing list

## Notes

- `/` and `/about` are prerendered; `/api/subscribe` is the only server route.
- A Sanity failure must never produce a non-200. The root layout falls back to a
  committed snapshot at `src/lib/data/settings.fallback.json`.
