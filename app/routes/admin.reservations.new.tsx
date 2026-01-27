import React, { useState, useEffect } from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useFetcher, Form, useNavigation, useActionData } from "react-router";
import {
  ArrowRight, ArrowLeft, Check, Users, X, Loader, CreditCard,
  QrCode, Link as LinkIcon, Copy, Wallet, RefreshCw
} from 'lucide-react';
import { db } from "@/db/db.server";
import { trips as tripsTable, clients as clientsTable, vehicle as vehicleTable, reservation as reservationTable, transaction as transactionTable, seat as seatTable } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { SeletorViagem } from '@/components/Selectors/SeletorViagem';
import { SeletorPassageiro } from '@/components/Selectors/SeletorPassageiro';
import { MapaAssentosReserva } from '@/components/Veiculos/MapaAssentosReserva';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TripStatus, ReservationStatus, TipoAssento, FormaPagamento, TipoTransacao, StatusTransacao, IViagem, ICliente, TipoCliente, TipoDocumento } from '@/types';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
  const tripsRaw = await db.query.trips.findMany({
    with: { route: true },
    where: eq(tripsTable.status, TripStatus.SCHEDULED)
  });

  const trips: IViagem[] = tripsRaw.map(t => ({
    ...t,
    status: t.status as any as TripStatus,
    route_name: (t as any).route?.name,
    origin_city: (t as any).route?.origin_city,
    destination_city: (t as any).route?.destination_city
  } as any as IViagem));

  const clientsRaw = await db.select().from(clientsTable);
  const clients = clientsRaw.map(c => ({
    ...c,
    tipo_cliente: c.tipo_cliente as any,
    documento_tipo: c.documento_tipo as any,
    saldo_creditos: Number(c.saldo_creditos || 0),
    valor_total_gasto: Number(c.valor_total_gasto || 0),
  } as any as ICliente));
  const vehiclesData = await db.select().from(vehicleTable);

  // Enrich vehicles with seats for the map
  const vehicles = await Promise.all(vehiclesData.map(async (v) => {
    const seats = await db.select().from(seatTable).where(eq(seatTable.vehicleId, v.id));
    return { ...v, mapa_assentos: seats };
  }));

  return json({ trips, clients, vehicles });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-reservation") {
    const payload = JSON.parse(formData.get("payload") as string);
    const { trip_id, reservations, payment_method } = payload;

    try {
      await db.transaction(async (tx) => {
        for (const res of reservations) {
          const [newRes] = await tx.insert(reservationTable).values({
            organization_id: "org_default",
            trip_id,
            client_id: res.client_id,
            passenger_name: res.passenger_name,
            passenger_document: res.passenger_document,
            seat_number: res.seat_number,
            total_price: res.price,
            status: ReservationStatus.CONFIRMED,
            payment_status: "PAID",
            ticket_code: `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          } as any).returning();

          // Create financial transaction
          await tx.insert(transactionTable).values({
            organization_id: "org_default",
            type: "INCOME",
            description: `Venda Passagem - ${res.passenger_name}`,
            amount: res.price,
            date: new Date().toISOString().split('T')[0],
            status: "PAID",
            payment_method: payment_method || "CASH"
          } as any);
        }
      });
      return redirect("/admin/reservations");
    } catch (e) {
      console.error(e);
      return json({ error: "Erro ao processar reservas" }, { status: 500 });
    }
  }

  return null;
};

export default function NewReservationPage() {
  const { trips, clients, vehicles } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [viagemSelecionada, setViagemSelecionada] = useState<any>(null);
  const [assentosSelecionados, setAssentosSelecionados] = useState<any[]>([]);
  const [passageirosMap, setPassageirosMap] = useState<any>({});
  const [veiculo, setVeiculo] = useState<any>(null);

  useEffect(() => {
    if (viagemSelecionada) {
      const v = vehicles.find((v: any) => v.id === viagemSelecionada.vehicle_id);
      setVeiculo(v || null);
    }
  }, [viagemSelecionada, vehicles]);

  const handleSelectSeat = (seat: any) => {
    setAssentosSelecionados(prev => {
      const exists = prev.find(a => a.numero === seat.numero);
      if (exists) return prev.filter(a => a.numero !== seat.numero);
      return [...prev, seat];
    });
  };

  const handleSelectClient = (seatNumber: string, client: any) => {
    setPassageirosMap((prev: any) => ({
      ...prev,
      [seatNumber]: {
        name: client.nome,
        document: client.documento,
        client_id: client.id
      }
    }));
  };

  const handleConfirm = () => {
    const payload = {
      trip_id: viagemSelecionada.id,
      payment_method: "CASH",
      reservations: assentosSelecionados.map(a => ({
        seat_number: a.numero,
        price: a.valor,
        passenger_name: passageirosMap[a.numero]?.name,
        passenger_document: passageirosMap[a.numero]?.document,
        client_id: passageirosMap[a.numero]?.client_id
      }))
    };
    fetcher.submit({ intent: "create-reservation", payload: JSON.stringify(payload) }, { method: "post" });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <PageHeader
        title="Nova Reserva"
        subtitle="Emissão de tickets e alocação de passageiros"
        backLink="/admin/reservations"
      />

      {/* Steps Visualizer */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-8 rounded-3xl shadow-xl space-y-6">
          <SeletorViagem viagens={trips} viagemSelecionada={viagemSelecionada} onChange={setViagemSelecionada} />
          <Button disabled={!viagemSelecionada} onClick={() => setStep(2)} className="h-14 w-full rounded-xl font-bold">PRÓXIMA ETAPA</Button>
        </Card>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-5 p-8 rounded-3xl shadow-xl">
            {veiculo && (
              <MapaAssentosReserva
                veiculo={veiculo}
                assentosReservados={[]}
                assentosSelecionados={assentosSelecionados}
                onSelecionarAssento={handleSelectSeat}
                precos={{ 'CONVENCIONAL': 100 }} // Mock
              />
            )}
          </Card>
          <div className="lg:col-span-7 space-y-6">
            {assentosSelecionados.map(a => (
              <Card key={a.numero} className="p-6 rounded-2xl shadow-md border-none bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-xl">Assento {a.numero}</span>
                  <Badge variant="outline">R$ {a.valor.toFixed(2)}</Badge>
                </div>
                <SeletorPassageiro clientes={clients} onSelecionarCliente={(c) => handleSelectClient(a.numero, c)} />
              </Card>
            ))}
            <Button disabled={assentosSelecionados.length === 0} onClick={() => setStep(3)} className="h-14 w-full rounded-xl font-bold">REVISÃO FINAL</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="p-8 rounded-3xl shadow-xl space-y-8">
          <div className="space-y-4 text-center">
            <Check size={48} className="mx-auto text-emerald-500" />
            <h2 className="text-2xl font-bold">Confirmação de Reserva</h2>
            <p className="text-muted-foreground">Revise os dados antes de finalizar a emissão</p>
          </div>
          <div className="space-y-2">
            {assentosSelecionados.map(a => (
              <div key={a.numero} className="flex justify-between border-b pb-2">
                <span>{a.numero} - {passageirosMap[a.numero]?.name}</span>
                <span className="font-bold">R$ {a.valor.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleConfirm} className="h-14 w-full rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700">FINALIZAR E EMITIR TICKETS</Button>
          <Button variant="ghost" onClick={() => setStep(2)} className="w-full">Voltar</Button>
        </Card>
      )}
    </div>
  );
}

const Badge: React.FC<{ children: React.ReactNode, variant?: string }> = ({ children, variant }) => (
  <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", variant === "outline" ? "border" : "bg-primary text-white")}>
    {children}
  </span>
);