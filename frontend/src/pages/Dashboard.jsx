import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, LogOut, Plus, 
  TrendingUp, AlertTriangle, AlertCircle, Sparkles,
  LayoutDashboard, Calculator
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import BudgetPlanner from './BudgetPlanner';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_URL = `${import.meta.env.VITE_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000')}/api`;

  const categories = ['Food', 'Travel', 'Rent', 'Shopping', 'Other'];
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [transRes, budgetRes, aiRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`, config),
        axios.get(`${API_URL}/budget`, config),
        axios.get(`${API_URL}/ai/suggestions`, config)
      ]);
      setTransactions(transRes.data);
      setBudget(budgetRes.data.limit || 0);
      setAiSuggestions(aiRes.data.suggestions || []);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    
    try {
      await axios.post(`${API_URL}/transactions`, {
        type,
        amount: Number(amount),
        category: type === 'expense' ? category : '',
        date: new Date()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setAmount('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!budgetLimit || isNaN(budgetLimit) || Number(budgetLimit) <= 0) return;
    
    try {
      await axios.post(`${API_URL}/budget`, { limit: Number(budgetLimit) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowBudgetModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expenses;
  const budgetUsage = budget > 0 ? (expenses / budget) * 100 : 0;
  
  // Category data for chart
  const expenseByCategory = categories.map(cat => ({
    name: cat,
    amount: transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(cat => cat.amount > 0);

  const TABS = [
    { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'budget-planner', label: 'Budget Planner', icon: Calculator },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#1e293b] p-4 md:p-6 rounded-2xl border border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Wallet className="text-indigo-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">FinGuard AI</h1>
              <p className="text-sm text-slate-400">Smart Budget Management</p>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 rounded-lg text-slate-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-[#1e293b] p-1.5 rounded-xl border border-slate-700/50 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">

            {/* Alerts & AI Suggestions */}
            {(budgetUsage >= 80 || aiSuggestions.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {budgetUsage >= 100 ? (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="text-red-500 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-red-500 font-semibold mb-1">Budget Exceeded!</h3>
                      <p className="text-sm text-red-400/80">You have crossed your monthly budget limit of ${budget}.</p>
                    </div>
                  </div>
                ) : budgetUsage >= 80 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="text-yellow-500 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-yellow-500 font-semibold mb-1">Approaching Limit</h3>
                      <p className="text-sm text-yellow-400/80">You have used {budgetUsage.toFixed(1)}% of your monthly budget.</p>
                    </div>
                  </div>
                ) : null}

                {aiSuggestions.length > 0 && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl flex items-start gap-4">
                    <Sparkles className="text-indigo-400 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-indigo-400 font-semibold mb-1">AI Suggestion</h3>
                      <p className="text-sm text-indigo-300/80">{aiSuggestions[0]}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet className="w-16 h-16 text-indigo-500" />
                </div>
                <p className="text-slate-400 font-medium mb-1">Total Balance</p>
                <h2 className="text-4xl font-bold text-white mb-2">${balance.toFixed(2)}</h2>
              </div>

              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-16 h-16 text-emerald-500" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Total Income</p>
                    <h2 className="text-3xl font-bold text-emerald-400 mb-2">${income.toFixed(2)}</h2>
                  </div>
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <ArrowUpRight className="text-emerald-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-16 h-16 text-red-500 transform scale-y-[-1]" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Total Expenses</p>
                    <h2 className="text-3xl font-bold text-red-400 mb-2">${expenses.toFixed(2)}</h2>
                  </div>
                  <div className="bg-red-500/20 p-2 rounded-lg">
                    <ArrowDownRight className="text-red-400 w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Progress */}
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Monthly Budget</h3>
                  <p className="text-sm text-slate-400">Track your spending limits</p>
                </div>
                <button 
                  id="set-budget-btn"
                  onClick={() => setShowBudgetModal(true)}
                  className="px-3 py-1.5 text-sm bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors font-medium"
                >
                  Set Limit
                </button>
              </div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-300">Spent: ${expenses.toFixed(2)}</span>
                <span className="text-slate-400">Limit: ${budget.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/50">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${budgetUsage > 100 ? 'bg-red-500' : budgetUsage > 80 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{budgetUsage.toFixed(1)}% used</span>
                <span>
                  {budget > 0
                    ? budgetUsage >= 100
                      ? `Over by $${(expenses - budget).toFixed(2)}`
                      : `$${(budget - expenses).toFixed(2)} remaining`
                    : 'No limit set'}
                </span>
              </div>
            </div>

            {/* Charts and Transactions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Charts */}
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-6">Expenses by Category</h3>
                {expenseByCategory.length > 0 ? (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseByCategory}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip 
                          cursor={{ fill: '#334155' }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-slate-500">
                    No expense data available
                  </div>
                )}
              </div>

              {/* Transactions */}
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700/50 shadow-lg flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                  <button 
                    id="add-transaction-btn"
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                    title="Add Transaction"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {transactions.length === 0 ? (
                    <p className="text-center text-slate-500 mt-10">No transactions recorded yet.</p>
                  ) : (
                    transactions.map((t) => (
                      <div key={t._id} className="flex justify-between items-center p-3 bg-[#0f172a]/50 rounded-xl border border-slate-700/30 hover:border-slate-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{t.type === 'income' ? 'Income' : t.category}</p>
                            <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BUDGET PLANNER TAB ── */}
        {activeTab === 'budget-planner' && (
          <div className="animate-fadeIn">
            <BudgetPlanner />
          </div>
        )}

      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-4">Add Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" id="type-expense" onClick={() => setType('expense')} className={`py-2 rounded-lg font-medium transition-colors ${type === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-[#0f172a] text-slate-400 border border-slate-700 hover:bg-slate-800'}`}>Expense</button>
                  <button type="button" id="type-income"  onClick={() => setType('income')}  className={`py-2 rounded-lg font-medium transition-colors ${type === 'income'  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#0f172a] text-slate-400 border border-slate-700 hover:bg-slate-800'}`}>Income</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Amount ($)</label>
                <input 
                  id="transaction-amount"
                  type="number" 
                  step="0.01"
                  required
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {type === 'expense' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select 
                    id="transaction-category"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-4">Set Monthly Budget</h3>
            <form onSubmit={handleSetBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Limit Amount ($)</label>
                <input 
                  id="budget-limit-input"
                  type="number"
                  step="0.01" 
                  required
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
