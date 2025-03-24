import { useRouter } from "next/router";
import { useEffect } from "react";
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Bank Management System</h1>
        <p className="text-lg mb-6">Welcome! Please log in or sign up to continue.</p>
        <div className="space-x-4">
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}