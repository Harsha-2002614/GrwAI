import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML shell for the static web export (`npx expo export --platform web`).
 * Web-only — native builds never read this file.
 *
 * It adds the meta tags that make the hosted prototype feel like an installed app when someone opens
 * the link on a phone and taps "Add to Home Screen": full-screen (no browser chrome), the app title
 * and icon on the home screen, and no zoom-in when a text field gets focus.
 *
 * `EXPO_BASE_URL` is set by Expo from `experiments.baseUrl` (see app.config.js), so the icon/manifest
 * links stay correct when the site is hosted under a sub-path such as GitHub Pages' /grwai/.
 */
const BASE = process.env.EXPO_BASE_URL ?? '';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GRWAI" />
        <meta name="description" content="GRWAI — Get Ready With AI. Iris, your AI stylist, reads your calendar, weather and closet, then styles you ahead of every moment." />
        <link rel="apple-touch-icon" href={`${BASE}/apple-touch-icon.png`} />
        <link rel="manifest" href={`${BASE}/manifest.webmanifest`} />
        {/* Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: shellStyles }} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: "if(!document.title)document.title='GRWAI — AI stylist';" }} />
      </body>
    </html>
  );
}

const shellStyles = `
  body { background-color: #FFFFFF; }
  /* Keep the phone-designed layout readable when the prototype is opened on a desktop browser. */
  @media (min-width: 600px) {
    body { background-color: #EAE7E1; }
    #root { max-width: 430px; margin: 0 auto; box-shadow: 0 0 0 1px #D8D8D8; background: #FFFFFF; }
  }
`;
