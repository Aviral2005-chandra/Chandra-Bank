"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";

export default function Investments() {
  const [userData, setUserData] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [investmentAmounts, setInvestmentAmounts] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");
  const router = useRouter();

  const indianStocks = [
    { symbol: "TCS.BSE", name: "Tata Consultancy Services" },
    { symbol: "RELIANCE.BSE", name: "Reliance Industries" },
    { symbol: "HDFCBANK.BSE", name: "HDFC Bank" },
    { symbol: "INFY.BSE", name: "Infosys" },
    { symbol: "ICICIBANK.BSE", name: "ICICI Bank" },
    { symbol: "SBIN.BSE", name: "State Bank of India" },
    { symbol: "HINDUNILVR.BSE", name: "Hindustan Unilever" },
    { symbol: "BAJFINANCE.BSE", name: "Bajaj Finance" },
    { symbol: "KOTAKBANK.BSE", name: "Kotak Mahindra Bank" },
    { symbol: "BHARTIARTL.BSE", name: "Bharti Airtel" },
    { symbol: "ASIANPAINT.BSE", name: "Asian Paints" },
    { symbol: "ITC.BSE", name: "ITC Limited" },
    { symbol: "AXISBANK.BSE", name: "Axis Bank" },
    { symbol: "MARUTI.BSE", name: "Maruti Suzuki" },
    { symbol: "LT.BSE", name: "Larsen & Toubro" },
    { symbol: "SUNPHARMA.BSE", name: "Sun Pharmaceutical" },
    { symbol: "TITAN.BSE", name: "Titan Company" },
    { symbol: "ULTRACEMCO.BSE", name: "UltraTech Cement" },
    { symbol: "NESTLEIND.BSE", name: "Nestlé India" },
    { symbol: "WIPRO.BSE", name: "Wipro" },
  ];

  const [stockPrices, setStockPrices] = useState<{ [key: string]: { price: number; growth: number } }>(
    indianStocks.reduce((acc, stock) => ({
      ...acc,
      [stock.symbol]: { price: Math.random() * 2000 + 1000, growth: (Math.random() - 0.5) * 0.1 }
    }), {})
  );

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
          portfolio: data?.portfolio || { balance: 0, investments: [] },
        });
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const updateStockPrices = () => {
      setStockPrices((prev) => {
        const newPrices = { ...prev };
        indianStocks.forEach((stock) => {
          const basePrice = newPrices[stock.symbol]?.price || Math.random() * 2000 + 1000;
          const growth = newPrices[stock.symbol]?.growth || (Math.random() - 0.5) * 0.1;
          newPrices[stock.symbol] = {
            price: Math.max(100, basePrice * (1 + growth / 100)),
            growth: (Math.random() - 0.5) * 0.1,
          };
        });
        return newPrices;
      });
    };

    const interval = setInterval(updateStockPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateProfitLoss = () => {
    let totalProfit = 0;
    let totalLoss = 0;
    userData?.portfolio?.investments?.forEach((inv: any) => {
      const currentPrice = stockPrices[inv.stock]?.price;
      if (!currentPrice) return; // Skip if stock price is undefined
      const investedValue = inv.amount;
      const currentValue = (investedValue / inv.initialPrice) * currentPrice;
      const diff = currentValue - investedValue;
      if (diff > 0) totalProfit += diff;
      else totalLoss += Math.abs(diff);
    });
    return { profit: totalProfit, loss: totalLoss };
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!userData || amount <= 0 || amount > userData.balance) {
      setError("Invalid amount or insufficient balance");
      return;
    }

    const updatedPortfolio = {
      balance: (userData.portfolio?.balance || 0) + amount,
      investments: userData.portfolio?.investments || [],
    };

    await updateDoc(doc(db, "users", userData.id), {
      balance: userData.balance - amount,
      portfolio: updatedPortfolio,
      transactions: arrayUnion({
        type: "Portfolio Deposit",
        amount,
        from: userData.accountNumber,
        to: "Portfolio",
        date: new Date().toISOString(),
      }),
    });

    setUserData({
      ...userData,
      balance: userData.balance - amount,
      portfolio: updatedPortfolio,
    });
    setDepositAmount("");
    setError("");
    alert("Deposit successful!");
  };

  const handleBuyStock = async (stockSymbol: string) => {
    const amount = parseFloat(investmentAmounts[stockSymbol] || "0");
    if (!userData || amount <= 0 || amount > (userData.portfolio?.balance || 0)) {
      setError("Invalid amount or insufficient portfolio balance");
      return;
    }

    const investment = {
      stock: stockSymbol,
      amount,
      initialPrice: stockPrices[stockSymbol].price,
      date: new Date().toISOString(),
      status: "Active",
    };

    const updatedPortfolio = {
      balance: (userData.portfolio?.balance || 0) - amount,
      investments: [...(userData.portfolio?.investments || []), investment],
    };

    await updateDoc(doc(db, "users", userData.id), {
      portfolio: updatedPortfolio,
      transactions: arrayUnion({
        type: "Investment",
        amount,
        from: "Portfolio",
        to: stockSymbol,
        date: new Date().toISOString(),
      }),
    });

    setUserData({
      ...userData,
      portfolio: updatedPortfolio,
    });
    setInvestmentAmounts({ ...investmentAmounts, [stockSymbol]: "" });
    setError("");
    alert(`Successfully bought ₹${amount} of ${stockSymbol}`);
  };

  const handleSellStock = async (investmentIndex: number) => {
    const investment = userData.portfolio.investments[investmentIndex];
    const currentPrice = stockPrices[investment.stock]?.price;
    if (!currentPrice) {
      setError(`Cannot sell ${investment.stock}: Current price unavailable`);
      return;
    }
    const investedValue = investment.amount;
    const currentValue = (investedValue / investment.initialPrice) * currentPrice;
    const updatedInvestments = userData.portfolio.investments.filter((_: any, i: number) => i !== investmentIndex);
    const updatedPortfolio = {
      balance: (userData.portfolio?.balance || 0) + currentValue,
      investments: updatedInvestments,
    };

    await updateDoc(doc(db, "users", userData.id), {
      portfolio: updatedPortfolio,
      transactions: arrayUnion({
        type: "Stock Sale",
        amount: currentValue,
        from: investment.stock,
        to: "Portfolio",
        date: new Date().toISOString(),
      }),
    });

    setUserData({
      ...userData,
      portfolio: updatedPortfolio,
    });
    alert(`Successfully sold ${investment.stock} for ₹${currentValue.toFixed(2)}`);
  };

  const handleTransferToAccount = async () => {
    const portfolioBalance = userData.portfolio?.balance || 0;
    const totalInvestedValue = userData.portfolio?.investments?.reduce((sum: number, inv: any) => {
      const currentPrice = stockPrices[inv.stock]?.price || inv.initialPrice; // Fallback to initialPrice if undefined
      return sum + (inv.amount / inv.initialPrice) * currentPrice;
    }, 0) || 0;
    const totalInvestedAmount = userData.portfolio.investments.reduce((sum: number, inv: any) => sum + inv.amount, 0) || 0;
    const profit = totalInvestedValue - totalInvestedAmount;
    const deduction = profit > 0 ? profit * 0.03 : 0;
    const transferAmount = portfolioBalance + totalInvestedValue - deduction;

    await updateDoc(doc(db, "users", userData.id), {
      balance: userData.balance + transferAmount,
      portfolio: { balance: 0, investments: [] },
      transactions: arrayUnion({
        type: "Portfolio Transfer",
        amount: transferAmount,
        from: "Portfolio",
        to: userData.accountNumber,
        date: new Date().toISOString(),
        deduction: deduction > 0 ? deduction : undefined,
      }),
    });

    setUserData({
      ...userData,
      balance: userData.balance + transferAmount,
      portfolio: { balance: 0, investments: [] },
    });
    alert(`Transferred ₹${transferAmount.toFixed(2)} to account (${deduction > 0 ? `₹${deduction.toFixed(2)} deducted as 3% profit fee` : "No deduction"})`);
  };

  if (!userData) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-zinc-600 dark:text-zinc-400">Loading...</motion.div>;

  const { profit, loss } = calculateProfitLoss();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-8 flex items-center justify-center">
          <Wallet className="mr-3 text-primary" size={36} /> Investment Hub
        </h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <ArrowUpCircle className="text-green-500" size={32} />
            <div>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Total Profit</h2>
              <p className="text-lg text-green-500">₹{profit.toFixed(2).toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <ArrowDownCircle className="text-red-500" size={32} />
            <div>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Total Loss</h2>
              <p className="text-lg text-red-500">₹{loss.toFixed(2).toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center">
              <DollarSign className="mr-2 text-primary" size={24} /> Deposit to Portfolio
            </h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Deposit
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center">
              <TrendingUp className="mr-2 text-primary" size={24} /> Stock Market
            </h2>
            <div className="max-h-96 overflow-y-auto space-y-4">
              {indianStocks.map((stock) => (
                <div key={stock.symbol} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <div className="mb-2 sm:mb-0">
                    <p className="text-zinc-800 dark:text-zinc-100 font-medium">{stock.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      ₹{stockPrices[stock.symbol]?.price.toFixed(2) || "N/A"} (
                      <span className={stockPrices[stock.symbol]?.growth >= 0 ? "text-green-500" : "text-red-500"}>
                        {stockPrices[stock.symbol]?.growth >= 0 ? "+" : ""}
                        {stockPrices[stock.symbol]?.growth.toFixed(2) || 0}%
                      </span>)
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={investmentAmounts[stock.symbol] || ""}
                      onChange={(e) => setInvestmentAmounts({ ...investmentAmounts, [stock.symbol]: e.target.value })}
                      placeholder="Amount"
                      className="w-24 border border-zinc-300 dark:border-zinc-700 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBuyStock(stock.symbol)}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Buy
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center">
            <Wallet className="mr-2 text-primary" size={24} /> Your Portfolio
          </h2>
          <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-4">
            Portfolio Balance: ₹{(userData.portfolio?.balance || 0).toLocaleString()}
          </p>
          <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Stock Investments</h3>
          {userData.portfolio?.investments?.length ? (
            <div className="space-y-4">
              {userData.portfolio.investments.map((inv: any, index: number) => {
                const currentPrice = stockPrices[inv.stock]?.price || inv.initialPrice; // Fallback to initialPrice
                const currentValue = (inv.amount / inv.initialPrice) * currentPrice;
                const profitLoss = currentValue - inv.amount;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 pb-2"
                  >
                    <div className="mb-2 sm:mb-0">
                      <p>
                        {inv.stock}: Invested ₹{inv.amount.toLocaleString()} on {new Date(inv.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        Current Value: ₹{currentValue.toFixed(2)} (
                        <span className={profitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                          {profitLoss >= 0 ? "+" : ""}{profitLoss.toFixed(2)}
                        </span>)
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSellStock(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Sell
                    </motion.button>
                  </motion.div>
                );
              })}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTransferToAccount}
                className="mt-4 bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Transfer All to Account
              </motion.button>
            </div>
          ) : (
            <p className="text-zinc-700 dark:text-zinc-300">No investments yet.</p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}