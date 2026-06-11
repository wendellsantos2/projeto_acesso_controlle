import type { APIRoute } from 'astro';
import { checkIn } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "O ID do cliente é obrigatório." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const visit = checkIn(clientId);
    return new Response(JSON.stringify(visit), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao realizar o check-in." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
