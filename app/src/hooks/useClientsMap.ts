import { useEffect, useState } from "react";
import { listClients } from "@/lib/clients";
import type { Client } from "@/types/entities";

export function useClientsMap() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const map = new Map(clients.map((c) => [c.id, c.name || c.email || "Client"]));
  return { clients, map, loading };
}
