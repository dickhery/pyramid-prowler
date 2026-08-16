# Project Guidance

## User Preferences

[No preferences yet]

## Verified Commands

**Frontend** (run from `src/frontend/`):

- **install**: `pnpm install --prefer-offline`
- **typecheck**: `pnpm typecheck`
- **lint fix**: `pnpm fix`
- **build**: `pnpm build`

**Backend** (run from `src/backend/`):

- **install**: `mops install`
- **typecheck**: `mops check --fix`
- **build**: `mops build`

**Backend and frontend integration** (run from root):

- **generate bindings**: `pnpm bindgen` This step is necessary to ensure the frontend can call the backend methods.

## Head Metadata (SEO and Link Previews)

`src/frontend/index.html` ships with social-sharing meta tags (`description`, `og:title`, `og:description`, `og:type`, `og:image`, `og:image:alt`, `twitter:card`, `twitter:image`). Links shared to this app only render a preview card if these tags are present in the deployed `index.html`.

When editing `index.html` (e.g. changing the title or favicon):

- **Never remove these meta tags.** Update them instead.
- Keep `og:title` identical to `<title>`, and `og:description` identical to the `description` meta tag.
- `og:image` and `twitter:image` must always point to an absolute `https://` URL. Keep the pre-configured default image unless the user explicitly provides or requests a custom share image; a custom image should be 1200×630 pixels.

## Learnings

[No learnings yet]

<!-- ic-skills:managed:start -->
<!-- state: configured (on-demand) -->
Fetch the skills index once per session and keep each skill's name, description,
and SKILL.md URL:
https://skills.internetcomputer.org/.well-known/skills/index.json
Before writing ICP code for a task, fetch the matching skill's SKILL.md
(https://skills.internetcomputer.org/.well-known/skills/{name}/SKILL.md) and follow
it. Skills are authoritative — prefer them over general knowledge.
<!-- ic-skills:managed:end -->
