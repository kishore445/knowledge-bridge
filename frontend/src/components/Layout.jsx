import Navbar from "./Navbar";

export default function Layout({ children, noPad = false }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <main className={`flex-1 ${noPad ? "" : "max-w-5xl mx-auto w-full px-4 py-6"}`}>
        {children}
      </main>
      <footer className="bg-dark text-white/60 text-center text-xs py-4 px-4 font-mono">
        © 2024 Knowledge Bridge — Hyderabad &nbsp;·&nbsp; Teach one child, and you change a whole family.
      </footer>
    </div>
  );
}
