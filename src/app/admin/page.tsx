"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, getDocs, arrayUnion, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { UserPlus, CreditCard, CheckCircle, Users } from "lucide-react";

export default function AdminPanel() {
  const [userData, setUserData] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState(""); // Changed from email
  const [amount, setAmount] = useState("");
  const [cardAccountNumber, setCardAccountNumber] = useState(""); // Changed from cardEmail
  const [cardType, setCardType] = useState("Credit");
  const [cardLimit, setCardLimit] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.email !== "aviralchandra2005@gmail.com") {
        router.push("/login");
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserData({ id: user.uid, ...userDoc.data() });
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(amount) <= 0) {
      setError("Invalid amount");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("accountNumber", "==", accountNumber));
      const usersSnapshot = await getDocs(q);

      if (usersSnapshot.empty) {
        setError("User not found with this account number");
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      const transaction = {
        type: "Admin Deposit",
        amount: parseFloat(amount),
        from: "Admin",
        to: userData.accountNumber,
        date: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", userDoc.id), {
        balance: userData.balance + parseFloat(amount),
        transactions: arrayUnion(transaction),
      });

      setUsers(users.map((u) => (u.id === userDoc.id ? { ...u, balance: u.balance + parseFloat(amount) } : u)));
      setAmount("");
      setAccountNumber("");
      setError("");
      alert("Funds added successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(cardLimit) <= 0) {
      setError("Invalid card limit");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("accountNumber", "==", cardAccountNumber));
      const usersSnapshot = await getDocs(q);

      if (usersSnapshot.empty) {
        setError("User not found with this account number");
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const cardNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
      const card = {
        type: cardType,
        number: cardNumber,
        limit: parseFloat(cardLimit),
        dateAdded: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", userDoc.id), {
        cards: arrayUnion(card),
      });

      setUsers(users.map((u) => (u.id === userDoc.id ? { ...u, cards: [...(u.cards || []), card] } : u)));
      setCardAccountNumber("");
      setCardType("Credit");
      setCardLimit("");
      setError("");
      alert("Card added successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveCard = async (userId: string, requestIndex: number) => {
    const user = users.find((u) => u.id === userId);
    const request = user.cardRequests[requestIndex];
    const cardNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const card = {
      type: request.type,
      network: request.network,
      number: cardNumber,
      limit: request.type === "Credit" ? 10000 : 0,
      dateAdded: new Date().toISOString(),
    };

    const updatedRequests = user.cardRequests.filter((_: any, i: number) => i !== requestIndex);
    await updateDoc(doc(db, "users", userId), {
      cards: arrayUnion(card),
      cardRequests: updatedRequests,
    });

    setUsers(users.map((u) => (u.id === userId ? { ...u, cards: [...(u.cards || []), card], cardRequests: updatedRequests } : u)));
    alert("Card request approved!");
  };

  const handleApproveFDRevoke = async (userId: string, requestIndex: number) => {
    const user = users.find((u) => u.id === userId);
    const revokeRequest = user.revokeRequests[requestIndex];
    const fdIndex = revokeRequest.fdIndex;
    const fd = user.investments[fdIndex];

    const updatedInvestments = user.investments.map((inv: any, i: number) =>
      i === fdIndex ? { ...inv, status: "Revoked" } : inv
    );
    const updatedRevokeRequests = user.revokeRequests.filter((_: any, i: number) => i !== requestIndex);

    await updateDoc(doc(db, "users", userId), {
      balance: user.balance + fd.amount,
      investments: updatedInvestments,
      revokeRequests: updatedRevokeRequests,
      transactions: arrayUnion({
        type: "FD Revoke",
        amount: fd.amount,
        from: "FD",
        to: user.accountNumber,
        date: new Date().toISOString(),
      }),
    });

    setUsers(users.map((u) =>
      u.id === userId
        ? {
            ...u,
            balance: u.balance + fd.amount,
            investments: updatedInvestments,
            revokeRequests: updatedRevokeRequests,
            transactions: [...(u.transactions || []), {
              type: "FD Revoke",
              amount: fd.amount,
              from: "FD",
              to: u.accountNumber,
              date: new Date().toISOString(),
            }],
          }
        : u
    ));
    alert("FD revoke request approved!");
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
            <Users className="mr-2 text-primary" size={28} />
            Admin Panel
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions Block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
                <UserPlus className="mr-2 text-primary" size={24} />
                Add Funds
              </h2>
              {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
              <form onSubmit={handleAddFunds} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors"
                >
                  Add Funds
                </motion.button>
              </form>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
                <CreditCard className="mr-2 text-primary" size={24} />
                Add Card
              </h2>
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={cardAccountNumber}
                    onChange={(e) => setCardAccountNumber(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Card Type</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Credit">Credit</option>
                    <option value="Debit">Debit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Card Limit (₹)</label>
                  <input
                    type="number"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors"
                >
                  Add Card
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Requests and Users Block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
                <CreditCard className="mr-2 text-primary" size={24} />
                Card Requests
              </h2>
              {users.some((u) => u.cardRequests?.length) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-zinc-700 dark:text-zinc-300">
                    <thead className="text-sm text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700">
                      <tr>
                        <th className="px-4 py-2">Account Number</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Network</th>
                        <th className="px-4 py-2">Requested Date</th>
                        <th className="px-4 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) =>
                        user.cardRequests?.map((request: any, index: number) => (
                          <motion.tr
                            key={`${user.id}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="border-b border-zinc-200 dark:border-zinc-700"
                          >
                            <td className="px-4 py-2">{user.accountNumber}</td>
                            <td className="px-4 py-2">{request.type}</td>
                            <td className="px-4 py-2">{request.network}</td>
                            <td className="px-4 py-2">{new Date(request.requestedDate).toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApproveCard(user.id, index)}
                                className="bg-green-500 text-white px-4 py-1 rounded-lg shadow-md hover:bg-green-600 transition-colors"
                              >
                                Approve
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-zinc-700 dark:text-zinc-300">No card requests pending.</p>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
                <CheckCircle className="mr-2 text-primary" size={24} />
                FD Revoke Requests
              </h2>
              {users.some((u) => u.revokeRequests?.length) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-zinc-700 dark:text-zinc-300">
                    <thead className="text-sm text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700">
                      <tr>
                        <th className="px-4 py-2">Account Number</th>
                        <th className="px-4 py-2">FD Amount</th>
                        <th className="px-4 py-2">Requested Date</th>
                        <th className="px-4 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) =>
                        user.revokeRequests?.map((request: any, index: number) => (
                          <motion.tr
                            key={`${user.id}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="border-b border-zinc-200 dark:border-zinc-700"
                          >
                            <td className="px-4 py-2">{user.accountNumber}</td>
                            <td className="px-4 py-2">₹{request.amount.toLocaleString()}</td>
                            <td className="px-4 py-2">{new Date(request.dateRequested).toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApproveFDRevoke(user.id, index)}
                                className="bg-green-500 text-white px-4 py-1 rounded-lg shadow-md hover:bg-green-600 transition-colors"
                              >
                                Approve
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-zinc-700 dark:text-zinc-300">No FD revoke requests pending.</p>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center mb-4">
                <Users className="mr-2 text-primary" size={24} />
                All Users
              </h2>
              {users.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-zinc-700 dark:text-zinc-300">
                    <thead className="text-sm text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700">
                      <tr>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Account Number</th>
                        <th className="px-4 py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: users.indexOf(user) * 0.1 }}
                          className="border-b border-zinc-200 dark:border-zinc-700"
                        >
                          <td className="px-4 py-2">{user.name}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">{user.accountNumber}</td>
                          <td className="px-4 py-2">₹{user.balance.toLocaleString()}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-zinc-700 dark:text-zinc-300">No users found.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}