import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🦷 SmileSync
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Sistema de gestión de citas dentales multi-clínica con recordatorios automatizados 
            para reducir las citas perdidas.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ir al Dashboard
            </Link>
            <Link
              href="/auth/login"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="text-lg font-semibold mb-2">Gestión de Citas</h3>
              <p className="text-gray-600">Calendario intuitivo con bloques de 30 minutos configurables</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">Recordatorios Automáticos</h3>
              <p className="text-gray-600">WhatsApp y SMS 24h antes con confirmación simple</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🏥</div>
              <h3 className="text-lg font-semibold mb-2">Multi-Clínica</h3>
              <p className="text-gray-600">Arquitectura escalable para múltiples organizaciones</p>
            </div>
          </div>

          <div className="mt-16 bg-white p-8 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Estado del Proyecto</h2>
            <div className="text-left max-w-2xl mx-auto">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Next.js 14 + TypeScript configurado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Prisma ORM + PostgreSQL configurado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Modelos multi-tenant definidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span>Autenticación - En desarrollo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span>Dashboard de citas - Pendiente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
