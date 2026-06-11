import type { APIRoute } from 'astro';
import { checkOut, checkOutByClientId } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { visitId, clientId } = body;

    let visit;
    if (visitId) {
      visit = checkOut(visitId);
    } else if (clientId) {
      visit = checkOutByClientId(clientId);
    } else {
      return new Response(
        JSON.stringify({ error: "O ID da visita ou ID do cliente é obrigatório." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(visit), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao realizar o check-out." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
