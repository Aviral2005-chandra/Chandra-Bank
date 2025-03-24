"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center flex-grow">
      <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 p-6 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 dark:bg-blue-700 text-white py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-800">
          Login
        </button>
      </form>
    </div>
  );
}