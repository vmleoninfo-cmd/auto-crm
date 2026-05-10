"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/constants";

function formatCLP(centavos: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(centavos / 100);
}

interface Purchase {
  id: string;
  producto: string;
  tipoProducto: string;
  monto: number;
  plataforma: string;
  estadoPago: string;
  utmCampaign: string | null;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: number | Date;
}

const ESTADO_COLORS: Record<string, string> = {
  completado: "text-green-700 bg-green-50 border-green-200",
  reembolsado: "text-red-700 bg-red-50 border-red-200",
  pendiente: "text-yellow-700 bg-yellow-50 border-yellow-200",
};

export default function VentasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/purchases")
      .then((r) => r.json())
      .then((d) => {
        setPurchases(d.data ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }, []);

  const ingresosMes = purchases
    .filter((p) => {
      const d = new Date(p.createdAt);
      const ahora = new Date();
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    })
    .reduce((s, p) => s + p.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas & Conversión</h1>
          <p className="text-muted-foreground">Compras registradas — Gumroad y manual</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total ventas", value: purchases.length, sub: "histórico" },
          { label: "Ingresos total", value: formatCLP(total), sub: "histórico" },
          { label: "Ingresos mes", value: formatCLP(ingresosMes), sub: "mes actual" },
          { label: "Ticket promedio", value: purchases.length > 0 ? formatCLP(Math.round(total / purchases.length)) : "-", sub: "promedio" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : purchases.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Sin ventas registradas" description="Las compras de Gumroad aparecen aquí automáticamente via webhook." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Campaña UTM</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.producto}</TableCell>
                  <TableCell>
                    <div className="text-sm">{p.contactName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{p.contactEmail}</div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-700">{formatCLP(p.monto)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.plataforma}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.utmCampaign || "-"}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADO_COLORS[p.estadoPago] || ""}`}>
                      {p.estadoPago}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
