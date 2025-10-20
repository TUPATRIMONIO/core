import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {/* Logo de TuPatrimonio */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#800039] to-[#a50049] rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TuPatrimonio</h1>
          <p className="text-lg text-gray-600 mb-8">Gestión inteligente de tu patrimonio personal</p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-8 max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Comenzar ahora</h2>
          <p className="text-gray-600 text-sm text-center mb-6">
            Inicia sesión o crea una cuenta para comenzar a gestionar tu patrimonio
          </p>

          <div className="flex gap-4 flex-col sm:flex-row w-full">
            <a
              className="bg-[#800039] hover:bg-[#a50049] text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md flex items-center justify-center gap-2 flex-1"
              href="/login"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 12H9m6 0l-3-3m3 3l-3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Iniciar Sesión
            </a>
            <a
              className="border border-[#800039] text-[#800039] hover:bg-[#800039] hover:text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 flex-1"
              href="/login"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Registrarse
            </a>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p className="text-gray-600 text-sm text-center">
          © 2024 TuPatrimonio. Gestiona tu patrimonio de forma inteligente.
        </p>
        <div className="flex gap-4 text-gray-600">
          <a href="#" className="hover:text-[#800039] transition-colors text-sm">
            Términos
          </a>
          <a href="#" className="hover:text-[#800039] transition-colors text-sm">
            Privacidad
          </a>
          <a href="#" className="hover:text-[#800039] transition-colors text-sm">
            Soporte
          </a>
        </div>
      </footer>
    </div>
  );
}
