import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/app/(auth)/login/LoginForm";

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-32 pb-12 min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <LoginForm initialIsLogin={false} />
      </main>
      <Footer />
    </>
  );
}
