import type { APIRoute } from 'astro';
import { getClients, addClient } from '../../lib/db';

// GET /api/clients - Search or list all clients
export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get('q')?.toLowerCase().trim() || '';
    const clients = getClients();

    if (query) {
      // Filter clients by full name match
      const filtered = clients.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query)
      );
      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(clients), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/clients - Register a new client
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { firstName, lastName, birthDate } = body;

    if (!firstName || !lastName || !birthDate) {
      return new Response(
        JSON.stringify({ error: "Nome, sobrenome e data de nascimento são obrigatórios." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newClient = addClient(firstName, lastName, birthDate);
    return new Response(JSON.stringify(newClient), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao registrar o cliente." }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
