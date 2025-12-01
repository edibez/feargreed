const REFRESH_PATH = '/api/fng/refresh';

function resolveBaseUrl() {
  if (process.env.URL) return process.env.URL;
  if (process.env.DEPLOY_URL) return process.env.DEPLOY_URL;
  if (process.env.NETLIFY_DEV === 'true') return 'http://localhost:8888';
  return null;
}

export default async (req) => {
  let nextRun;
  try {
    const body = await req.json();
    nextRun = body?.next_run;
  } catch (err) {
    console.warn('refresh-fng: failed to parse request body', err);
  }

  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    console.error('refresh-fng: unable to determine site base URL');
    return new Response(JSON.stringify({ error: 'missing_base_url' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const target = `${baseUrl}${REFRESH_PATH}`;

  try {
    const resp = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('refresh-fng: refresh API failed', resp.status, text);
      return new Response(
        JSON.stringify({ error: 'refresh_failed', status: resp.status, body: text }),
        {
          status: resp.status,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    const payload = await resp.json();
    console.log('refresh-fng: stored new reading', {
      nextRun,
      indexTime: payload?.index_time,
      finalIndex: payload?.final_index,
    });

    return new Response(JSON.stringify({ ok: true, nextRun, payload }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('refresh-fng: error invoking refresh endpoint', err);
    return new Response(JSON.stringify({ error: 'exception', message: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const config = {
  schedule: '@hourly',
};
