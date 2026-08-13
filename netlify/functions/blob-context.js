/* blob-context.js
   Shared helper for supplying explicit Netlify Blobs options
   to `getStore(name, { siteID, token })` so functions can
   operate when the automatic environment context is missing.

   Usage: const { blobOptions } = require('./blob-context');
          const store = getStore('name', blobOptions());
*/

const siteID = process.env.NETLIFY_SITE_ID || process.env.NETLIFY_PROJECT_ID || process.env.NETLIFY_BLOBS_SITE_ID;
const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN;

function blobOptions() {
  const opts = {};
  if (siteID) opts.siteID = siteID;
  if (token) opts.token = token;
  return opts;
}

module.exports = { blobOptions };
