import fs from 'fs';
import path from 'path';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Visit {
  id: string;
  clientId: string;
  checkInAt: string;
  checkOutAt: string | null;
  ageAtVisit: number;
}

export interface VisitWithClient extends Visit {
  client: Client;
}

const dbPath = path.join(process.cwd(), 'src/data/db.json');

// Helper to ensure database file exists
function ensureDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    const defaultData = { clients: [], visits: [] };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

// Read database
export function readDb(): { clients: Client[]; visits: Visit[] } {
  ensureDb();
  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database:", error);
    return { clients: [], visits: [] };
  }
}

// Write database
export function writeDb(data: { clients: Client[]; visits: Visit[] }) {
  ensureDb();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing to database:", error);
  }
}

// Age calculator helper
export function calculateAge(birthDateString: string, referenceDateString?: string): number {
  const birthDate = new Date(birthDateString);
  const referenceDate = referenceDateString ? new Date(referenceDateString) : new Date();
  
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Client operations
export function getClients(): Client[] {
  const db = readDb();
  return db.clients;
}

export function getClientById(id: string): Client | undefined {
  const db = readDb();
  return db.clients.find(c => c.id === id);
}

export function addClient(firstName: string, lastName: string, birthDate: string): Client {
  const db = readDb();
  
  // Basic validation
  if (!firstName || !lastName || !birthDate) {
    throw new Error("Nome, sobrenome e data de nascimento são obrigatórios.");
  }

  const newClient: Client = {
    id: 'c' + (db.clients.length + 1) + '_' + Math.random().toString(36).substring(2, 7),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    birthDate: birthDate,
    createdAt: new Date().toISOString()
  };

  db.clients.push(newClient);
  writeDb(db);
  return newClient;
}

// Visit operations
export function getVisits(): Visit[] {
  const db = readDb();
  return db.visits;
}

export function getVisitsWithClients(): VisitWithClient[] {
  const db = readDb();
  return db.visits.map(visit => {
    const client = db.clients.find(c => c.id === visit.clientId);
    return {
      ...visit,
      client: client || {
        id: visit.clientId,
        firstName: "Cliente",
        lastName: "Removido",
        birthDate: "2000-01-01",
        createdAt: ""
      }
    };
  });
}

export function getActiveVisits(): VisitWithClient[] {
  return getVisitsWithClients().filter(v => v.checkOutAt === null);
}

export function checkIn(clientId: string): Visit {
  const db = readDb();
  const client = db.clients.find(c => c.id === clientId);
  
  if (!client) {
    throw new Error("Cliente não encontrado.");
  }

  // Check if client is already inside
  const activeVisit = db.visits.find(v => v.clientId === clientId && v.checkOutAt === null);
  if (activeVisit) {
    throw new Error("Cliente já está no estabelecimento (entrada ativa).");
  }

  const age = calculateAge(client.birthDate);

  const newVisit: Visit = {
    id: 'v' + (db.visits.length + 1) + '_' + Math.random().toString(36).substring(2, 7),
    clientId: client.id,
    checkInAt: new Date().toISOString(),
    checkOutAt: null,
    ageAtVisit: age
  };

  db.visits.push(newVisit);
  writeDb(db);
  return newVisit;
}

export function checkOut(visitId: string): Visit {
  const db = readDb();
  const visitIndex = db.visits.findIndex(v => v.id === visitId);

  if (visitIndex === -1) {
    throw new Error("Registro de visita não encontrado.");
  }

  if (db.visits[visitIndex].checkOutAt !== null) {
    throw new Error("Cliente já realizou a saída para esta visita.");
  }

  db.visits[visitIndex].checkOutAt = new Date().toISOString();
  writeDb(db);
  return db.visits[visitIndex];
}

export function checkOutByClientId(clientId: string): Visit {
  const db = readDb();
  const visit = db.visits.find(v => v.clientId === clientId && v.checkOutAt === null);

  if (!visit) {
    throw new Error("Cliente não está no estabelecimento (nenhuma entrada ativa encontrada).");
  }

  visit.checkOutAt = new Date().toISOString();
  writeDb(db);
  return visit;
}
