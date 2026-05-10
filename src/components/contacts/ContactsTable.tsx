"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search, Users, Download } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { SOURCE_LABELS } from "@/lib/constants";
import type { Contact, Temperature, LeadSource } from "@/types";

interface ContactsTableProps {
  contacts: Contact[];
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterTemp, setFilterTemp] = useState<Temperature | "">("");
  const [filterEstado, setFilterEstado] = useState("");

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase());

    const matchesTemp = !filterTemp || c.temperature === filterTemp;
    const matchesEstado = !filterEstado || (c as unknown as Record<string, unknown>).estadoRelacion === filterEstado;

    return matchesSearch && matchesTemp && matchesEstado;
  });

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No hay contactos"
        description="Agrega tu primer contacto para comenzar a gestionar tu pipeline de ventas."
        actionLabel="Agregar contacto"
        onAction={() => router.push("/contacts?new=true")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", "hot", "warm", "cold"] as const).map((temp) => (
            <Button
              key={temp}
              variant={filterTemp === temp ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTemp(temp)}
              className="cursor-pointer"
            >
              {temp === "" ? "Todos" : temp === "hot" ? "Caliente" : temp === "warm" ? "Tibio" : "Frio"}
            </Button>
          ))}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="text-sm border rounded-md px-2 py-1 bg-background cursor-pointer"
          >
            <option value="">Todos los estados</option>
            <option value="lead_nuevo">Nuevo</option>
            <option value="lead_frio">Frío</option>
            <option value="lead_tibio">Tibio</option>
            <option value="lead_caliente">Caliente</option>
            <option value="lead_calificado_asesoria_1a1">Calificado</option>
            <option value="cliente_guia">Cliente guía</option>
            <option value="cliente_recurrente">Recurrente</option>
            <option value="cliente_premium">Premium</option>
            <option value="candidato_comunidad">Comunidad</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/export?type=contacts")}
            className="cursor-pointer"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Empresa</TableHead>
              <TableHead className="hidden md:table-cell">Fuente</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead className="hidden md:table-cell">Estado EI</TableHead>
              <TableHead className="hidden md:table-cell">Score</TableHead>
              <TableHead className="hidden lg:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/contacts/${contact.id}`)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.email || "Sin email"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {contact.company || "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {SOURCE_LABELS[contact.source as LeadSource] || contact.source}
                </TableCell>
                <TableCell>
                  <StatusBadge temperature={contact.temperature as Temperature} size="sm" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {(() => {
                    const estado = (contact as unknown as Record<string, unknown>).estadoRelacion as string;
                    const labels: Record<string, string> = {
                      lead_nuevo: "Nuevo", lead_frio: "Frío", lead_tibio: "Tibio",
                      lead_caliente: "Caliente", lead_calificado_asesoria_1a1: "Calificado",
                      cliente_guia: "Guía", cliente_recurrente: "Recurrente",
                      cliente_premium: "Premium", candidato_comunidad: "Comunidad", inactivo: "Inactivo",
                    };
                    const colors: Record<string, string> = {
                      lead_nuevo: "bg-slate-100 text-slate-700", lead_frio: "bg-blue-50 text-blue-700",
                      lead_tibio: "bg-yellow-50 text-yellow-700", lead_caliente: "bg-orange-50 text-orange-700",
                      lead_calificado_asesoria_1a1: "bg-purple-50 text-purple-700",
                      cliente_guia: "bg-green-50 text-green-700", cliente_recurrente: "bg-green-100 text-green-800",
                      cliente_premium: "bg-emerald-100 text-emerald-800", candidato_comunidad: "bg-indigo-50 text-indigo-700",
                      inactivo: "bg-gray-100 text-gray-500",
                    };
                    if (!estado) return <span className="text-xs text-muted-foreground">-</span>;
                    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[estado] || "bg-slate-100 text-slate-700"}`}>{labels[estado] || estado}</span>;
                  })()}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${contact.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {contact.score}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(contact.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} de {contacts.length} contactos
      </p>
    </div>
  );
}
