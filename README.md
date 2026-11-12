# Musik — combined Lavalink bot + dashboard

One Render **web service** runs both the Discord bot and its dashboard on the same port. Source files are at the repository root, and `npm start` runs `node index.js`.

## Setup
1. Extract ZIP and upload the contents (not the ZIP) to a GitHub repository.
2. In Render create a Node web service; build command `npm install`, start command `npm start`, root directory blank.
3. Set variables from `.env.example` in Render Environment. Do **not** commit a real `.env` with tokens/secrets.
4. In Discord Developer Portal > OAuth2 > Redirects, add the exact URL from `DISCORD_OAUTH_CALLBACK_URL`, e.g. `https://musik.example.com/auth/callback`.
5. Set `PUBLIC_DOMAIN` to your actual public HTTPS website URL, and set `DISCORD_OAUTH_CALLBACK_URL` to that domain plus `/auth/callback`.
6. Enable the bot's Server Members intent only if needed by other features; the dashboard checks the user's voice membership via guild member fetch.
7. Configure an external Lavalink v4 server and compatible source plugins; restart the service.

## Routes
- `/` public landing page
- `/auth/login` Discord OAuth2 login
- `/auth/callback` Discord OAuth2 callback
- `/dashboard.html` dashboard
- `/health` health check

## Notes
- Dashboard server controls require Discord **Manage Server** permission and the user in the bot's voice channel.
- Session storage uses Express's in-memory store, suitable only for a single instance and testing. For production reliability across restarts/multiple instances use a persistent session store (e.g. Redis).
- OAuth redirect URL must be HTTPS on a public domain and **exactly** match the portal setting.
- 100 slash-command definitions are included in consolidated source; some are presets and optional commands may be placeholders. Lavalink playback has not been live-tested.
- This is a combined deployment; you no longer need a separate website Render service.
