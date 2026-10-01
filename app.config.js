// app.config.js — extends app.json (Expo merges the two; app.json stays the source of truth).
//
// Lets the static web export be hosted under a sub-path without touching app.json, e.g.
// GitHub Pages project sites live at https://<user>.github.io/<repo>/ :
//
//   WEB_BASE_URL=/grwai npx expo export --platform web
//
// With WEB_BASE_URL unset the config is returned untouched (native builds, `expo start`,
// and root-hosted web exports such as Netlify/Vercel are unaffected).
module.exports = ({ config }) => {
  const baseUrl = process.env.WEB_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...(config.experiments || {}), baseUrl } };
};
