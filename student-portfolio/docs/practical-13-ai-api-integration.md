# Practical 13: AI API Integration into a Web Application

## Objective

Offer an optional AI-generated task description while keeping the API key
private, the suggestion editable, and normal task creation available when the
AI service is unavailable.

## Setup

1. Copy `.env.example` to `.env` if you have not already created the local
   environment file.
2. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/api-keys)
   and put it in `.env`:

   ```env
   GEMINI_API_KEY=your_key_here
   ```

3. Restart the backend after changing `.env`. The key is read only by Express;
   do not put it in a `VITE_` variable, frontend source, screenshots, or Git.
4. For Docker Compose, the backend service receives `GEMINI_API_KEY` from the
   local `.env`. Recreate the backend after changing it.

The `.env` file is ignored by Git. `.env.example` intentionally contains no
real credential. If no key is configured, the Generate button returns a clear
unavailable message and users can still enter a description themselves.

## Use the feature

1. Sign in and open the Task Manager.
2. Enter a short task title and click **Generate description**.
3. Wait for the loading label to finish. The generated description appears in
   an editable field; review or change it before saving the task.
4. Save the task. Its title and description appear in the task list and remain
   editable.
5. The suggestion is AI-generated and may be inaccurate. Do not send personal,
   confidential, financial, health, credential, or other sensitive information
   to an external AI provider.

The browser calls the authenticated `/api/ai/generate-description` backend
route. Express sends only the entered task title to Gemini models using
Google's Interactions REST API. The Gemini credential is added as a
server-side API-key header and is never returned to the browser. The backend
tries `gemini-3.5-flash-lite`, then `gemini-3.8-flash`, then
`gemini-3.1-pro-preview` when a model is missing or returns a temporary server error.
It stops on authentication or invalid-request errors. A `429` quota/rate-limit
response does not trigger a more expensive model. Check Google AI Studio billing
and model pricing before enabling paid models. A successful response names the
model used so the user can see which one generated the suggestion. Successful
requests for the same user and task title are limited to one per minute, and
each request times out after 15 seconds. If all models fail, the backend
returns a fallback without preventing task creation; failed requests do not
consume the one-minute successful-request limit.

## Test without a paid API call

Run the backend and frontend, sign in, and try generating a description with
`GEMINI_API_KEY` unset. Confirm that the interface shows an unavailable
message but still lets you type and save a task description. The authenticated
AI route can also be checked in Postman with a JSON body such as:

```json
{
  "title": "Prepare weekly project report"
}
```

The response is either an editable description or a fallback message. An
immediate second request for the same title returns HTTP 429 until one minute
has passed. Never use a real key in Postman screenshots or commit it.

## Analysis

- **Why call the AI provider from the backend?** A frontend key is visible in
  downloaded JavaScript and browser network traffic. The backend keeps it in
  server environment configuration and can authenticate, validate, rate-limit,
  and constrain requests.
- **Graceful degradation:** The suggestion is optional. If the key is absent,
  the provider fails, or the request times out, the app displays a message and
  still permits manual description entry and ordinary task operations.
- **Privacy and governance:** Send only the minimum information needed.
  Never send credentials, personal identifiers, private work, financial or
  health information, or confidential student/customer data without explicit
  authorization and an approved data-handling process. Review provider
  retention policies and institutional rules. Google's Gemini free tier has
  model and rate limits; check the current [Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing)
  and the AI Studio usage page before relying on it.

## Evidence

- Capture the Task Manager showing the generated editable suggestion and
  visible AI review disclaimer.
- Capture the fallback message with the backend running and no Gemini key
  configured; demonstrate that a manually entered task can still be saved.
