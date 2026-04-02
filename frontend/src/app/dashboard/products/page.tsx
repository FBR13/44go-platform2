'use client';

import Link from 'next/link';

export default function ProductsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meus Produtos</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
          + Novo Produto
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Aqui entrarão os produtos vindos do backend NestJS */}
            <tr>
              <td className="px-6 py-4 text-sm text-gray-900">Exemplo: Hambúrguer Artesanal</td>
              <td className="px-6 py-4 text-sm text-gray-900">R$ 35,00</td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                <button className="text-red-600 hover:text-red-900">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link href="/dashboard" className="text-gray-600 hover:underline">
          &larr; Voltar ao painel
        </Link>
      </div>
    </div>
  );
}