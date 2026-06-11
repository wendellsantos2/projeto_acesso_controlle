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

const STORAGE_KEY = 'acesso_seguro_db';

// Helper to calculate age in JS
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

// Initial Mock Seed Data
const DEFAULT_CLIENTS: Client[] = [
  {
    id: "c1",
    firstName: "Ana",
    lastName: "Silva",
    birthDate: "1990-05-15",
    createdAt: "2026-06-10T14:30:00.000Z"
  },
  {
    id: "c2",
    firstName: "Bruno",
    lastName: "Santos",
    birthDate: "2010-08-20",
    createdAt: "2026-06-11T10:15:00.000Z"
  },
  {
    id: "c3",
    firstName: "Camila",
    lastName: "Costa",
    birthDate: "2000-11-02",
    createdAt: "2026-06-11T11:00:00.000Z"
  },
  {
    id: "c4",
    firstName: "Daniel",
    lastName: "Oliveira",
    birthDate: "2009-02-14",
    createdAt: "2026-06-11T12:00:00.000Z"
  },
  {
    id: "c5",
    firstName: "Eduardo",
    lastName: "Rocha",
    birthDate: "1985-03-30",
    createdAt: "2026-06-11T13:00:00.000Z"
  }
];

const DEFAULT_VISITS = (clients: Client[]): Visit[] => {
  const now = new Date();
  
  const minutesAgo = (mins: number) => {
    return new Date(now.getTime() - mins * 60 * 1000).toISOString();
  };

  return [
    {
      id: "v1",
      clientId: "c1",
      checkInAt: minutesAgo(120),
      checkOutAt: minutesAgo(60),
      ageAtVisit: calculateAge("1990-05-15", minutesAgo(120))
    },
    {
      id: "v2",
      clientId: "c3",
      checkInAt: minutesAgo(90),
      checkOutAt: minutesAgo(30),
      ageAtVisit: calculateAge("2000-11-02", minutesAgo(90))
    },
    {
      id: "v3",
      clientId: "c2",
      checkInAt: minutesAgo(45),
      checkOutAt: null,
      ageAtVisit: calculateAge("2010-08-20", minutesAgo(45))
    },
    {
      id: "v4",
      clientId: "c5",
      checkInAt: minutesAgo(15),
      checkOutAt: null,
      ageAtVisit: calculateAge("1985-03-30", minutesAgo(15))
    }
  ];
};

// Safe Database Read
export function readDb(): { clients: Client[]; visits: Visit[] } {
  if (typeof window === 'undefined') {
    return { clients: DEFAULT_CLIENTS, visits: DEFAULT_VISITS(DEFAULT_CLIENTS) };
  }
  
  const content = localStorage.getItem(STORAGE_KEY);
  if (!content) {
    const clients = DEFAULT_CLIENTS;
    const visits = DEFAULT_VISITS(clients);
    const initialData = { clients, visits };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing localStorage db:", error);
    return { clients: DEFAULT_CLIENTS, visits: DEFAULT_VISITS(DEFAULT_CLIENTS) };
  }
}

// Safe Database Write
export function writeDb(data: { clients: Client[]; visits: Visit[] }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

// Client operations
export function getClients(): Client[] {
  return readDb().clients;
}

export function getClientById(id: string): Client | undefined {
  return readDb().clients.find(c => c.id === id);
}

export function addClient(firstName: string, lastName: string, birthDate: string): Client {
  const db = readDb();
  
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
  return readDb().visits;
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
