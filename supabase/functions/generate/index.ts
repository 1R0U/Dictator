import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ClaudeMessage = { role: 'user' | 'assistant'; content: string };
type GenerateRequest = {
  model?: string;
  system?: string;
  messages?: ClaudeMessage[];
  maxTokens?: number;
};

const MAX_INPUT_CHARACTERS = 40_000;
const ALLOWED_MODELS = new Set(['claude-haiku-4-5-20251001']);

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!authorization || !supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Authentication required' }, 401);
  }
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return json({ error: 'Authentication required' }, 401);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY is not configured' }, 503);

  try {
    const body = await request.json() as GenerateRequest;
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: 'messages are required' }, 400);
    }
    const model = body.model ?? Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5-20251001';
    if (!ALLOWED_MODELS.has(model)) return json({ error: 'Unsupported model' }, 400);
    const validMessages = body.messages.every((message) =>
      (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
      && message.content.length > 0
    );
    const inputCharacters = (body.system?.length ?? 0)
      + body.messages.reduce((sum, message) => sum + (message.content?.length ?? 0), 0);
    if (!validMessages || inputCharacters > MAX_INPUT_CHARACTERS) {
      return json({ error: 'invalid or oversized input' }, 400);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model,
        system: body.system ?? '',
        messages: body.messages,
        max_tokens: Math.min(Math.max(body.maxTokens ?? 1024, 1), 4096),
      }),
    });

    const payload = await response.json();
    if (!response.ok) return json({ error: 'Claude request failed' }, response.status);
    const text = Array.isArray(payload.content)
      ? payload.content.filter((item: { type?: string }) => item.type === 'text')
        .map((item: { text?: string }) => item.text ?? '').join('')
      : '';
    return json({ text });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
