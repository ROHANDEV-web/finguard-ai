import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  TrendingDown, ArrowRight, Loader2, Wallet, ShoppingBag,
  Utensils, Home, Car, MoreHorizontal, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORY_ICONS = {
  Food: Utensils,
  Rent: Home,
  Travel: Car,
  Shopping: ShoppingBag,
  Other: MoreHorizontal,
};

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const categoryPercentages = (categoryData, total) =>
  categoryData.map(c => ({ ...c, pct: total > 0 ? ((c.amount / total) * 100).toFixed(1) : 0 }));

export default function SpendingSummary({ onContinue }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`${API_URL}/transactions`, config);
        const transactions = res.data;

        const expenses = transactions.filter(t => t.type === 'expense');
        const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);

        const catMap = {};
        expenses.forEach(t => {
          catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });

        const categoryData = Object.entries(catMap)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount);

        const topCategory = categoryData[0]?.name || null;

        setData({ income, totalExpenses, categoryData, topCategory });
      } catch {
        setData({ income: 0, totalExpenses: 0, categoryData: [], topCategory: null });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm">Analyzing your spending...</p>
        </div>
      </div>
    );
  }

  const enriched = categoryPercentages(data.categoryData, data.totalExpenses);
  const savings = data.income - data.totalExpenses;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 animate-fadeIn">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-sm font-medium border border-indigo-500/30 mb-2">
            <Sparkles className="w-4 h-4" />
            Monthly Snapshot
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back! 👋</h1>
          <p className="text-slate-400">Here's how your finances look this month</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700/50 text-center">
            <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Income</p>
            <p className="text-2xl font-bold text-emerald-400">${data.income.toFixed(0)}</p>
          </div>
          <div className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700/50 text-center">
            <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Spent</p>
            <p className="text-2xl font-bold text-red-400">${data.totalExpenses.toFixed(0)}</p>
          </div>
          <div className={`rounded-2xl p-5 border text-center ${savings >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Saved</p>
            <p className={`text-2xl font-bold ${savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {savings >= 0 ? '+' : ''}${savings.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Main content */}
        {data.categoryData.length > 0 ? (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">Spending Breakdown</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-center">
                {/* Pie Chart */}
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={enriched}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {enriched.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                        formatter={(val) => [`$${val.toFixed(2)}`, 'Spent']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category List */}
                <div className="space-y-3">
                  {enriched.map((cat, i) => {
                    const Icon = CATEGORY_ICONS[cat.name] || MoreHorizontal;
                    return (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS[i % COLORS.length] + '30' }}>
                          <Icon className="w-4 h-4" style={{ color: COLORS[i % COLORS.length] }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300 font-medium">{cat.name}</span>
                            <span className="text-slate-400">${cat.amount.toFixed(2)} <span className="text-xs">({cat.pct}%)</span></span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${cat.pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insight */}
              {data.topCategory && (
                <div className="mt-6 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-300">
                    Your highest spending category is <strong className="text-indigo-200">{data.topCategory}</strong> at{' '}
                    <strong className="text-indigo-200">${enriched[0]?.amount.toFixed(2)}</strong> ({enriched[0]?.pct}% of all expenses).{' '}
                    {Number(enriched[0]?.pct) > 40 ? 'This is quite high — consider setting a tighter limit for it.' : 'Keep tracking to stay on budget!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-10 text-center space-y-3">
            <Wallet className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400">No spending data yet — start adding transactions to see insights here!</p>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/20"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
