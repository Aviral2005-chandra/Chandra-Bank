"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion } from "firebase/firestore";
import { motion } from "framer-motion";
import { Wallet, Send, History } from "lucide-react";

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState(""); // Changed to account number
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        setUserData({
          id: user.uid,
          ...data,
          balance: data?.balance ?? 0,
          portfolio: data?.portfolio || { balance: 0, investments: [] },
          investments: data?.investments || [],
          transactions: data?.transactions || [],
        });
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleFundTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || parseFloat(amount) <= 0 || parseFloat(amount) > (userData.balance || 0)) {
      setError("Invalid amount or insufficient balance");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("accountNumber", "==", recipientAccountNumber)); // Changed to accountNumber
      const usersSnapshot = await getDocs(q);

      if (usersSnapshot.empty) {
        setError("Recipient account not found");
        return;
      }

      const recipientDoc = usersSnapshot.docs[0];
      const recipientData = recipientDoc.data();

      const senderRef = doc(db, "users", userData.id);
      const recipientRef = doc(db, "users", recipientDoc.id);
      const transaction = {
        type: "Transfer",
        amount: parseFloat(amount),
        from: userData.accountNumber,
        to: recipientData.accountNumber,
        date: new Date().toISOString(),
      };

      await updateDoc(senderRef, {
        balance: userData.balance - parseFloat(amount),
        transactions: arrayUnion(transaction),
      });
      await updateDoc(recipientRef, {
        balance: (recipientData.balance || 0) + parseFloat(amount),
        transactions: arrayUnion({ ...transaction, type: "Received" }),
      });

      setUserData({
        ...userData,
        balance: userData.balance - parseFloat(amount),
        transactions: [...(userData.transactions || []), transaction],
      });
      setAmount("");
      setRecipientAccountNumber(""); // Reset account number
      setError("");
      alert("Transfer successful!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateInvestmentStats = () => {
    const portfolioInvestments = userData?.portfolio?.investments || [];
    const fdInvestments = userData?.investments || [];

    const totalStockInvestment = portfolioInvestments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const stockProfit = portfolioInvestments.reduce((sum: number, inv: any) => {
      const daysSinceInvestment = (new Date().getTime() - new Date(inv.date || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
      const annualProfit = (inv.amount || 0) * 0.10;
      const dailyProfit = annualProfit / 365;
      return sum + dailyProfit * daysSinceInvestment;
    }, 0);

    const totalFDInvestment = fdInvestments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const fdProfit = fdInvestments.reduce((sum: number, inv: any) => {
      const daysSinceInvestment = (new Date().getTime() - new Date(inv.date || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
      const annualProfit = (inv.amount || 0) * ((inv.interestRate || 0) / 100);
      const dailyProfit = annualProfit / 365;
      return sum + dailyProfit * daysSinceInvestment;
    }, 0);

    return {
      totalInvestment: totalStockInvestment + totalFDInvestment,
      totalProfit: stockProfit + fdProfit,
    };
  };

  if (!userData) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen text-zinc-600 dark:text-zinc-400"
    >
      Loading...
    </motion.div>
  );

  const { totalInvestment, totalProfit } = calculateInvestmentStats();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
            <Wallet className="mr-2 text-primary" size={24} />
            Dashboard
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
              Welcome, {userData.name || "User"}!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Account: {userData.accountNumber || "N/A"}
            </p>
            {userData.isAdmin && (
              <p className="text-xs sm:text-sm text-primary mt-2">Admin Access</p>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Main Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-primary dark:text-primary mt-1">
              ₹{(userData.balance || 0).toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Portfolio: ₹{(userData.portfolio?.balance || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Investments</p>
            <p className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 mt-1">
              ₹{(totalInvestment || 0).toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-2">
              Profit: ₹{(totalProfit || 0).toFixed(2).toLocaleString()}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-1 bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
              <Send className="mr-2 text-primary" size={20} />
              Fund Transfer
            </h2>
            {error && <p className="text-red-500 mb-4 text-xs sm:text-sm">{error}</p>}
            <form onSubmit={handleFundTransfer} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Recipient Account Number
                </label>
                <input
                  type="text"
                  value={recipientAccountNumber}
                  onChange={(e) => setRecipientAccountNumber(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                  maxLength={10}
                  minLength={10}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Transfer
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="lg:col-span-2 bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
              <History className="mr-2 text-primary" size={20} />
              Transaction History
            </h2>
            {userData.transactions?.length ? (
              <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4">
                {userData.transactions.map((tx: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2 text-sm"
                  >
                    <span className="mb-1 sm:mb-0">
                      {tx.type} of ₹{(tx.amount || 0).toLocaleString()} {tx.type === "Transfer" ? "to" : "from"} {tx.to || "N/A"}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(tx.date || Date.now()).toLocaleString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-700 dark:text-zinc-300 text-sm">No transactions yet.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}