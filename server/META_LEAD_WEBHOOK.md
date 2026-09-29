# Meta Instant Form Lead Webhook

The callback URL is `https://<your-api-domain>/api/webhooks/meta`. Meta requires a publicly reachable HTTPS URL; `localhost` cannot receive production webhooks.

Configure these server environment variables without committing their values:

- `META_VERIFY_TOKEN`: a random string shared with the Meta webhook setup.
- `META_APP_SECRET`: the app secret used to verify `X-Hub-Signature-256`.
- `META_PAGE_ACCESS_TOKEN`: a Page access token with the `leads_retrieval` permission.
- `META_PAGE_ID`: the Page ID to accept (recommended).
- `META_GRAPH_API_VERSION`: optional Graph API version, defaults to `v23.0`.

In Meta for Developers, add the Page `leadgen` webhook subscription, set the callback URL and verify token, then subscribe the app to the Facebook Page. The webhook fetches each lead by ID from Graph API, stores it with `source: meta`, and ignores duplicate lead IDs. The Meta app/Page must also have the permissions and access level required for the Page and form.

Leads appear in the normal Sales > Leads list. Do not expose the Page access token or app secret in the frontend.