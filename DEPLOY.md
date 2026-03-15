# Production deploy (super-admin.pixeldesk.in)

## Login ↔ dashboard loop fix

The app is built with **same-origin API proxy** (`NEXT_PUBLIC_USE_API_PROXY=true`). All API calls go to `https://super-admin.pixeldesk.in/api/proxy/...`, which Next.js rewrites to `https://api.pixeldesk.in/...`.

- **Login/OTP** run through this proxy, so the session cookie is set in the context of `super-admin.pixeldesk.in`.
- **Dashboard** server-side session check also uses the proxy and the request’s cookies, so the server can read the session.

If you still see a redirect loop (dashboard → login → dashboard):

1. **Rebuild and redeploy** so the image includes `NEXT_PUBLIC_USE_API_PROXY=true` (see Dockerfile and `.github/workflows/deploy-prod.yml`).
2. **Backend cookie domain**  
   If the backend sets an explicit `Domain` on the session cookie (e.g. `Domain=api.pixeldesk.in`), the browser will only send it to the API host, and the app at super-admin.pixeldesk.in will never get it.  
   Ask the backend to set the session cookie with **`Domain=.pixeldesk.in`** (leading dot) so it is sent to both `api.pixeldesk.in` and `super-admin.pixeldesk.in`.  
   If the backend does not set `Domain`, the cookie is tied to the request host; with the proxy, that can be the app host and the loop should not occur.

## Build args (CI / Docker)

- `NEXT_PUBLIC_API_URL` – e.g. `https://api.pixeldesk.in`
- `NEXT_PUBLIC_USE_API_PROXY=true` – required for production so dashboard session works
- `NEXT_PUBLIC_DASHBOARD_URL` / `NEXT_PUBLIC_BASE_URL` – optional, for links

## See CI build errors locally

If you can’t view GitHub Actions logs (e.g. “Sign in to view logs”), run the same Docker build on your machine to see the full error:

```bash
# From repo root. Replace the URLs with your real values (or from GitHub Secrets).
docker build --progress=plain \
  --build-arg NEXT_PUBLIC_API_URL=https://api.pixeldesk.in \
  --build-arg NEXT_PUBLIC_DASHBOARD_URL=https://super-admin.pixeldesk.in \
  --build-arg NEXT_PUBLIC_BASE_URL=https://super-admin.pixeldesk.in \
  --build-arg NEXT_PUBLIC_USE_API_PROXY=true \
  -t pixel-super-admin:latest .
```

Scroll to the end of the output; the failure (e.g. from `npm run build`) will be there.
