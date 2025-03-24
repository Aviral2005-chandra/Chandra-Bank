"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { motion } from "framer-motion";
import { Lock, PlusCircle, Clock, XCircle } from "lucide-react";

export default function FixedDeposit() {
  const [userData, setUserData] = useState<any>(null);
  const [fdAmount, setFdAmount] = useState("");
  const [fdTenure, setFdTenure] = useState("1");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        setUserData({ id: user.uid, ...data });
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (userData?.investments?.length) {
      const latestFD = userData.investments.reduce((latest: any, current: any) =>
        new Date(current.date) > new Date(latest.date) ? current : latest
      );
      const maturityDate = new Date(latestFD.date);
      maturityDate.setFullYear(maturityDate.getFullYear() + latestFD.tenure);

      const updateTimer = () => {
        const now = new Date();
        const diff = maturityDate.getTime() - now.getTime();
        if (diff <= 0) {
          setTimeLeft("Matured");
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [userData]);

  const getInterestRate = (tenure: number) => {
    switch (tenure) {
      case 1:
        return 8.23;
      case 3:
        return 14.50;
      case 5:
        return 19.69;
      default:
        return 8.23;
    }
  };

  const handleFD = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fdAmount);
    const tenure = parseInt(fdTenure);

    if (!userData || amount <= 0 || amount > userData.balance) {
      setError("Invalid amount or insufficient balance");
      return;
    }

    const interestRate = getInterestRate(tenure);
    const fd = {
      type: "Fixed Deposit",
      amount,
      tenure,
      interestRate,
      date: new Date().toISOString(),
      status: "Active",
    };

    try {
      await updateDoc(doc(db, "users", userData.id), {
        balance: userData.balance - amount,
        investments: arrayUnion(fd),
        transactions: arrayUnion({
          type: "FD",
          amount,
          from: userData.accountNumber,
          to: "FD",
          date: new Date().toISOString(),
        }),
      });

      setUserData({
        ...userData,
        balance: userData.balance - amount,
        investments: [...(userData.investments || []), fd],
        transactions: [
          ...(userData.transactions || []),
          { type: "FD", amount, from: userData.accountNumber, to: "FD", date: new Date().toISOString() },
        ],
      });
      setFdAmount("");
      setFdTenure("1");
      setError("");
      alert("FD created successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevokeFD = async (index: number) => {
    const fd = userData.investments[index];
    if (fd.status !== "Active") {
      setError("Cannot revoke an inactive FD");
      return;
    }

    const revokeRequest = {
      fdIndex: index,
      amount: fd.amount,
      dateRequested: new Date().toISOString(),
      status: "Pending",
    };

    try {
      await updateDoc(doc(db, "users", userData.id), {
        revokeRequests: arrayUnion(revokeRequest),
      });
      setUserData({
        ...userData,
        revokeRequests: [...(userData.revokeRequests || []), revokeRequest],
      });
      setError("");
      alert("Revoke request submitted for admin approval!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateMaturity = (amount: number, tenure: number, interestRate: number) => {
    return amount * Math.pow(1 + interestRate / 100, tenure);
  };

  const isRevokePending = (index: number) => {
    return userData.revokeRequests?.some((req: any) => req.fdIndex === index && req.status === "Pending");
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

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center">
            <Lock className="mr-2 text-primary" size={28} />
            Fixed Deposits
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
              <PlusCircle className="mr-2 text-primary" size={24} />
              Create Fixed Deposit
            </h2>
            {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
            <form onSubmit={handleFD} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={fdAmount}
                  onChange={(e) => setFdAmount(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tenure (Years)
                </label>
                <select
                  value={fdTenure}
                  onChange={(e) => setFdTenure(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="1">1 Year (8.23%)</option>
                  <option value="3">3 Years (14.50%)</option>
                  <option value="5">5 Years (19.69%)</option>
                </select>
              </div>
              {fdAmount && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Maturity Amount: ₹{calculateMaturity(parseFloat(fdAmount), parseInt(fdTenure), getInterestRate(parseInt(fdTenure))).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Create FD
              </motion.button>
            </form>
            {userData.investments?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center">
                  <Clock className="mr-2" size={16} />
                  Latest FD matures in: <span className="ml-1 font-semibold">{timeLeft}</span>
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
              <Lock className="mr-2 text-primary" size={24} />
              Your Fixed Deposits
            </h2>
            {userData.investments?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-zinc-700 dark:text-zinc-300">
                  <thead className="text-sm text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700">
                    <tr>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Tenure</th>
                      <th className="px-4 py-2">Interest Rate</th>
                      <th className="px-4 py-2">Maturity Amount</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.investments.map((inv: any, index: number) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="border-b border-zinc-200 dark:border-zinc-700"
                      >
                        <td className="px-4 py-2">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-4 py-2">{inv.tenure} Years</td>
                        <td className="px-4 py-2">{inv.interestRate}%</td>
                        <td className="px-4 py-2">
                          ₹{calculateMaturity(inv.amount, inv.tenure, inv.interestRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2">{new Date(inv.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              inv.status === "Active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {inv.status === "Active" && !isRevokePending(index) ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRevokeFD(index)}
                              className="flex items-center bg-red-500 text-white px-3 py-1 rounded-lg shadow-md hover:bg-red-600 transition-colors"
                            >
                              <XCircle className="mr-1" size={16} />
                              Revoke
                            </motion.button>
                          ) : isRevokePending(index) ? (
                            <span className="text-yellow-600 dark:text-yellow-400 text-sm">Waiting for Admin Approval</span>
                          ) : null}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-zinc-700 dark:text-zinc-300">No fixed deposits yet.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}