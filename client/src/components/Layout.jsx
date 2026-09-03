import Navbar from './Navbar';
import Footer from './Footer';
import Toast from './Toast';

export default function Layout({
  children,
  showNavbar = true,
  showFooter = true,
  maxWidth = 'max-w-7xl',
  className = '',
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#070d1e] text-slate-100 relative overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-emerald-600/5 blur-3xl rounded-full" />
        <div className="absolute top-2/3 -right-40 w-96 h-96 bg-purple-600/5 blur-3xl rounded-full" />
      </div>

      {showNavbar && <Navbar />}

      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 ${maxWidth} ${className}`}>
        {children}
      </main>

      {showFooter && <Footer />}

      <Toast />
    </div>
  );
}
