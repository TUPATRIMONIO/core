'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrdersList from '@/components/checkout/OrdersList';
import { Package } from 'lucide-react';
import type { OrderStatus } from '@/lib/checkout/core';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<string>('all');

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Órdenes</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona y revisa todas tus órdenes de compra
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Estado</CardTitle>
          <CardDescription>
            Selecciona el estado de las órdenes que deseas ver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todas
              </TabsTrigger>
              <TabsTrigger value="pending_payment" className="text-xs sm:text-sm">
                Pendientes
              </TabsTrigger>
              <TabsTrigger value="paid" className="text-xs sm:text-sm">
                Pagadas
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Completadas
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
                Canceladas
              </TabsTrigger>
              <TabsTrigger value="refunded" className="text-xs sm:text-sm">
                Reembolsadas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <OrdersList status="all" />
            </TabsContent>

            <TabsContent value="pending_payment" className="mt-6">
              <OrdersList status="pending_payment" />
            </TabsContent>

            <TabsContent value="paid" className="mt-6">
              <OrdersList status="paid" />
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <OrdersList status="completed" />
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              <OrdersList status="cancelled" />
            </TabsContent>

            <TabsContent value="refunded" className="mt-6">
              <OrdersList status="refunded" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

