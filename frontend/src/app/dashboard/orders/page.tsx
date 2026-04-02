'use client';

import Link from 'next/link';

export default function OrdersPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pedidos Recentes</h1>

      <div className="space-y-4">
        {/* Card de Pedido de Exemplo */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">Pedido #1234</h3>
            <p className="text-sm text-gray-600">Cliente: João Silva • 2 itens</p>
            <p className="font-medium text-green-600 mt-1">R$ 70,00</p>
          </div>
          <div>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded border border-yellow-200">
              Pendente
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard" className="text-gray-600 hover:underline">
          &larr; Voltar ao painel
        </Link>
      </div>
    </div>
  );
}