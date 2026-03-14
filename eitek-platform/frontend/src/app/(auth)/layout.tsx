'use client';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1e3a5f]">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#2a4a6f]/50 rounded-full" />
        <div className="absolute -bottom-48 -left-24 w-[500px] h-[500px] bg-[#16304d]/80 rounded-full" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          {/* Main Content - Centered */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-6xl font-bold text-white tracking-wider mb-4">EITEK</h1>
            <p className="text-sm text-white/80 tracking-[0.3em] uppercase">
              Electrical & Electronics Technology
            </p>
          </div>

          {/* Footer */}
          <div className="p-8 text-center">
            <p className="text-sm text-white/50">© 2026 EITEK.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#f0f4f8]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}