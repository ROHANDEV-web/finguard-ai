import { useState } from 'react';
import {
  Calculator, Sparkles, ChevronDown, ChevronUp,
  Utensils, Home, Car, ShoppingBag, MoreHorizontal,
  Zap, Wifi, Heart, Dumbbell, GraduationCap, Baby,
  CheckCircle2, AlertTriangle, TrendingUp
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { id: 'rent',        label: 'Rent / Housing',   icon: Home,          color: '#8b5cf6', placeholder: 'e.g. 800' },
  { id: 'food',        label: 'Food & Groceries',  icon: Utensils,      color: '#10b981', placeholder: 'e.g. 300' },
  { id: 'transport',   label: 'Transport / Travel',icon: Car,           color: '#3b82f6', placeholder: 'e.g. 150' },
  { id: 'utilities',   label: 'Utilities',          icon: Zap,           color: '#f59e0b', placeholder: 'e.g. 100' },
  { id: 'internet',    label: 'Internet / Phone',   icon: Wifi,          color: '#06b6d4', placeholder: 'e.g. 50'  },
  { id: 'health',      label: 'Health / Medical',   icon: Heart,         color: '#ef4444', placeholder: 'e.g. 80'  },
  { id: 'fitness',     label: 'Gym / Fitness',      icon: Dumbbell,      color: '#ec4899', placeholder: 'e.g. 40'  },
  { id: 'education',   label: 'Education / Books',  icon: GraduationCap, color: '#a78bfa', placeholder: 'e.g. 60'  },
  { id: 'shopping',    label: 'Shopping',           icon: ShoppingBag,   color: '#f97316', placeholder: 'e.g. 200' },
  { id: 'childcare',   label: 'Childcare / Family', icon: Baby,          color: '#84cc16', placeholder: 'e.g. 100' },
  { id: 'other',       label: 'Other',              icon: MoreHorizontal,color: '#94a3b8', placeholder: 'e.g. 50'  },
];

const SAVINGS_GOALS = [
  { id: 'emergency', label: 'Emergency Fund' },
  { id: 'vacation',  label: 'Vacation/Travel' },
  { id: 'investment',label: 'Investments' },
  { id: 'home',      label: 'Buying a Home' },
  { id: 'debt',      label: 'Pay Off Debt' },
  { id: 'retire',    label: 'Retirement' },
];

function generateBudgetPlan(income, expenses, savingsTarget) {
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + (Number(b) || 0), 0);
  const disposable = income - totalExpenses;
  const actualSavings = Math.max(0, disposable);

  // Ideal budget ratios (50/30/20 rule contextualised)
  const needs = ['rent', 'food', 'transport', 'utilities', 'internet', 'health', 'childcare'];
  const wants = ['shopping', 'fitness', 'education', 'other'];

  const needsTotal = needs.reduce((a, k) => a + (Number(expenses[k]) || 0), 0);
  const wantsTotal = wants.reduce((a, k) => a + (Number(expenses[k]) || 0), 0);

  const needsPct  = income > 0 ? (needsTotal / income) * 100 : 0;
  const wantsPct  = income > 0 ? (wantsTotal / income) * 100 : 0;
  const savingsPct = income > 0 ? (actualSavings / income) * 100 : 0;
  const targetPct  = income > 0 ? (savingsTarget / income) * 100 : 0;

  // Build recommendations
  const recs = [];

  if (needsPct > 50) {
    recs.push({ type: 'warning', text: `Your essential expenses (${needsPct.toFixed(0)}% of income) exceed the recommended 50%. Look for ways to reduce rent, groceries, or transport.` });
  } else {
    recs.push({ type: 'success', text: `Great! Essentials are ${needsPct.toFixed(0)}% of income — within the healthy 50% benchmark.` });
  }

  if (wantsPct > 30) {
    recs.push({ type: 'warning', text: `Discretionary spending (${wantsPct.toFixed(0)}% of income) is above the 30% guideline. Try trimming shopping or subscriptions.` });
  } else {
    recs.push({ type: 'success', text: `Discretionary spend is ${wantsPct.toFixed(0)}% — nicely under the 30% limit.` });
  }

  if (savingsPct >= 20) {
    recs.push({ type: 'success', text: `Excellent savings rate of ${savingsPct.toFixed(0)}%! You're building a strong financial cushion.` });
  } else if (savingsPct > 0) {
    const gap = (0.2 * income) - actualSavings;
    recs.push({ type: 'warning', text: `Your savings rate is ${savingsPct.toFixed(0)}%. To hit 20%, you'd need to save $${gap.toFixed(0)} more per month.` });
  } else {
    recs.push({ type: 'danger', text: `Your expenses exceed your income by $${Math.abs(disposable).toFixed(2)}. Immediate action needed — cut non-essential spending.` });
  }

  if (savingsTarget > 0 && actualSavings < savingsTarget) {
    const shortfall = savingsTarget - actualSavings;
    recs.push({ type: 'warning', text: `You're $${shortfall.toFixed(2)} short of your monthly savings goal. Consider reducing discretionary spending first.` });
  } else if (savingsTarget > 0) {
    recs.push({ type: 'success', text: `You can meet your $${savingsTarget} monthly savings goal with $${(actualSavings - savingsTarget).toFixed(2)} to spare!` });
  }

  // Suggested allocations based on 50/30/20
  const suggested = {
    needs:   (0.50 * income).toFixed(2),
    wants:   (0.30 * income).toFixed(2),
    savings: (0.20 * income).toFixed(2),
  };

  return {
    totalExpenses,
    disposable,
    actualSavings,
    needsTotal,
    wantsTotal,
    needsPct,
    wantsPct,
    savingsPct,
    targetPct,
    recs,
    suggested,
  };
}

export default function BudgetPlanner() {
  const [income, setIncome] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [expenses, setExpenses] = useState({});
  const [savingsGoal, setSavingsGoal] = useState('');
  const [plan, setPlan] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const handleGenerate = () => {
    const inc = Number(income);
    if (!inc || inc <= 0) return;
    const result = generateBudgetPlan(inc, expenses, Number(savingsTarget) || 0);
    setPlan(result);
    // Scroll to results
    setTimeout(() => document.getElementById('budget-results')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const visibleCategories = showAll ? EXPENSE_CATEGORIES : EXPENSE_CATEGORIES.slice(0, 6);

  const statusColor = (type) => ({
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2 },
    warning: { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-400',  icon: AlertTriangle },
    danger:  { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     icon: AlertTriangle },
  }[type] || {});

  return (
    <div className="space-y-8">

      {/* Input Section */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Calculator className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Budget Planner</h2>
              <p className="text-sm text-slate-400">Enter your monthly income & expenses for a personalized plan</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Income & Savings Goal */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Monthly Income ($) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  id="planner-income"
                  type="number"
                  min="0"
                  placeholder="e.g. 3000"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Monthly Savings Target ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  id="planner-savings-target"
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={savingsTarget}
                  onChange={e => setSavingsTarget(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Savings Goal Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Savings Goal (optional)</label>
            <div className="flex flex-wrap gap-2">
              {SAVINGS_GOALS.map(g => (
                <button
                  key={g.id}
                  id={`goal-${g.id}`}
                  onClick={() => setSavingsGoal(g.id === savingsGoal ? '' : g.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    savingsGoal === g.id
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-[#0f172a] border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Monthly Expenses by Category</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleCategories.map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="bg-[#0f172a] border border-slate-700/60 rounded-xl p-3 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-md" style={{ backgroundColor: cat.color + '20' }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      </div>
                      <span className="text-xs font-medium text-slate-300">{cat.label}</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                      <input
                        id={`expense-${cat.id}`}
                        type="number"
                        min="0"
                        placeholder={cat.placeholder}
                        value={expenses[cat.id] || ''}
                        onChange={e => setExpenses(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg pl-6 pr-2 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAll ? <><ChevronUp className="w-4 h-4" /> Show fewer categories</> : <><ChevronDown className="w-4 h-4" /> Show all {EXPENSE_CATEGORIES.length} categories</>}
            </button>
          </div>

          {/* Generate Button */}
          <button
            id="generate-budget-plan"
            onClick={handleGenerate}
            disabled={!income || Number(income) <= 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 group"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Generate My Budget Plan
          </button>
        </div>
      </div>

      {/* Results */}
      {plan && (
        <div id="budget-results" className="space-y-6 animate-fadeIn">

          {/* Overview */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Your Budget Overview</h3>
            </div>

            {/* 50/30/20 Visual */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Needs (50%)</span>
                <span>Wants (30%)</span>
                <span>Savings (20%)</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-1">
                <div className="bg-violet-500 transition-all duration-700" style={{ width: `${Math.min(plan.needsPct, 100)}%` }} title="Needs" />
                <div className="bg-blue-500 transition-all duration-700"   style={{ width: `${Math.min(plan.wantsPct, 100)}%` }} title="Wants" />
                <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(plan.savingsPct, 100)}%` }} title="Savings" />
              </div>
              <div className="flex text-xs justify-between text-slate-400 gap-4">
                <span className="text-violet-400">{plan.needsPct.toFixed(0)}% — ${plan.needsTotal.toFixed(0)}</span>
                <span className="text-blue-400">{plan.wantsPct.toFixed(0)}% — ${plan.wantsTotal.toFixed(0)}</span>
                <span className="text-emerald-400">{plan.savingsPct.toFixed(0)}% — ${plan.actualSavings.toFixed(0)}</span>
              </div>
            </div>

            {/* Key Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Monthly Income',  value: `$${Number(income).toFixed(0)}`,          color: 'text-white'       },
                { label: 'Total Expenses',  value: `$${plan.totalExpenses.toFixed(0)}`,      color: 'text-red-400'     },
                { label: 'Savings / Month', value: `$${plan.actualSavings.toFixed(0)}`,      color: plan.actualSavings >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'Savings Rate',    value: `${plan.savingsPct.toFixed(1)}%`,         color: plan.savingsPct >= 20 ? 'text-emerald-400' : plan.savingsPct > 0 ? 'text-yellow-400' : 'text-red-400' },
              ].map(item => (
                <div key={item.label} className="bg-[#0f172a] rounded-xl p-4 text-center border border-slate-700/40">
                  <p className="text-slate-400 text-xs mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ideal Allocation */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-base font-bold text-white mb-1">Ideal 50/30/20 Allocation</h3>
            <p className="text-sm text-slate-400 mb-4">Based on your income of <strong className="text-slate-200">${Number(income).toFixed(0)}/month</strong></p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Needs (50%)',   sub: 'Rent, Food, Transport, Utilities',  val: plan.suggested.needs,   actual: plan.needsTotal,  color: '#8b5cf6', over: plan.needsTotal > Number(plan.suggested.needs) },
                { label: 'Wants (30%)',   sub: 'Shopping, Fitness, Entertainment',  val: plan.suggested.wants,   actual: plan.wantsTotal,  color: '#3b82f6', over: plan.wantsTotal > Number(plan.suggested.wants) },
                { label: 'Savings (20%)', sub: savingsGoal ? SAVINGS_GOALS.find(g=>g.id===savingsGoal)?.label : 'Emergency fund, Investments', val: plan.suggested.savings, actual: plan.actualSavings, color: '#10b981', over: plan.actualSavings < Number(plan.suggested.savings) },
              ].map(item => (
                <div key={item.label} className="bg-[#0f172a] rounded-xl p-4 border border-slate-700/40">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.over ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {item.over ? 'Over' : 'OK'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white mb-1" style={{ color: item.color }}>${item.val}</p>
                  <p className="text-xs text-slate-400">Actual: ${Number(item.actual).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Smart Recommendations</h3>
            </div>
            <div className="space-y-3">
              {plan.recs.map((rec, i) => {
                const s = statusColor(rec.type);
                const Icon = s.icon;
                return (
                  <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-4 flex items-start gap-3`}>
                    <Icon className={`w-5 h-5 ${s.text} shrink-0 mt-0.5`} />
                    <p className={`text-sm ${s.text}`}>{rec.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
