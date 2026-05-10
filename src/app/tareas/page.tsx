"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Check, X } from "lucide-react";
import { formatDate } from "@/lib/constants";

interface Tarea {
  id: string;
  titulo: string;
  accion: string;
  tipo: string;
  prioridad: string;
  estado: string;
  responsable: string;
  origenModulo: string | null;
  fechaLimite: number | Date | null;
  createdAt: number | Date;
}

const PRIORIDAD_COLORS: Record<string, string> = {
  critica: "text-red-700 bg-red-50 border-red-300",
  alta: "text-orange-700 bg-orange-50 border-orange-300",
  media: "text-yellow-700 bg-yellow-50 border-yellow-200",
  baja: "text-slate-600 bg-slate-50 border-slate-200",
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "text-blue-700 bg-blue-50 border-blue-200",
  ejecutada: "text-green-700 bg-green-50 border-green-200",
  descartada: "text-slate-500 bg-slate-50 border-slate-200",
};

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");

  const cargar = () => {
    setLoading(true);
    fetch(`/api/tasks${filtro ? `?estado=${filtro}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setTareas(d.data ?? []); setLoading(false); });
  };

  useEffect(() => { cargar(); }, [filtro]);

  const ejecutar = async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "ejecutar" }),
    });
    cargar();
  };

  const descartar = async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "descartar" }),
    });
    cargar();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operaciones & Tareas</h1>
        <p className="text-muted-foreground">Tareas generadas desde decisiones y automatizaciones</p>
      </div>

      <div className="flex gap-2">
        {["pendiente", "ejecutada", "descartada", ""].map((e) => (
          <Button
            key={e}
            variant={filtro === e ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro(e)}
            className="cursor-pointer"
          >
            {e || "Todas"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : tareas.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Sin tareas" description="Las tareas se generan automáticamente desde el motor de decisiones." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Fecha límite</TableHead>
                <TableHead>Estado</TableHead>
                {filtro === "pendiente" && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tareas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{t.titulo}</div>
                    <div className="text-xs text-muted-foreground">{t.accion}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORIDAD_COLORS[t.prioridad] || ""}`}>
                      {t.prioridad}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline">{t.tipo}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.origenModulo || "manual"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(t.fechaLimite)}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADO_COLORS[t.estado] || ""}`}>
                      {t.estado}
                    </span>
                  </TableCell>
                  {filtro === "pendiente" && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 cursor-pointer text-green-700 border-green-200" onClick={() => ejecutar(t.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 cursor-pointer text-slate-500" onClick={() => descartar(t.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
