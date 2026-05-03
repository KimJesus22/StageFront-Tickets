import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-32 pb-12 min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <LoginForm />
      </main>
      <Footer />
    </>
  );
}
