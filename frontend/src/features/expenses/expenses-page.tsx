import { useEffect, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { expenseApi, type Expense } from './api';

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const money = (amount: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'SAR' }).format(amount);
const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
const message = (cause: unknown) => cause instanceof Error ? cause.message : 'Request failed. Please try again.';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(today);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [items, options] = await Promise.all([expenseApi.list(), expenseApi.categories()]);
      setExpenses(items);
      setCategories(options);
      setCategory((current) => current || options[0] || '');
    } catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await expenseApi.create({ description, amount: Number(amount), category, date });
      setExpenses((items) => [created, ...items].sort((a, b) => b.date.localeCompare(a.date)));
      setDescription('');
      setAmount('');
      toast.success('Expense added');
    } catch (cause) { toast.error(message(cause)); }
    finally { setSaving(false); }
  }

  async function remove(expense: Expense) {
    if (!window.confirm(`Delete "${expense.description}"?`)) return;
    setDeleting(true);
    try {
      await expenseApi.remove(expense.id);
      setExpenses((items) => items.filter((item) => item.id !== expense.id));
      toast.success('Expense deleted');
    } catch (cause) { toast.error(message(cause)); }
    finally { setDeleting(false); }
  }

  const visible = expenses.filter((item) => (!filter || item.category === filter) && item.description.toLowerCase().includes(search.toLowerCase()));
  const monthItems = expenses.filter((item) => item.date.startsWith(today().slice(0, 7)));
  return (
    <div className="container space-y-6 pb-6">
      <div><h1 className="text-2xl font-semibold">Your expenses</h1><p className="mt-1 text-muted-foreground">Keep track of everyday spending, one expense at a time.</p></div>
      {error && <div role="alert" className="rounded-xl border border-destructive p-4"><p>{error}</p><Button className="mt-3" variant="outline" onClick={() => void load()}>Retry</Button></div>}
      <div className="grid gap-4 sm:grid-cols-3">
        {[['This month', money(monthItems.reduce((sum, item) => sum + item.amount, 0))], ['All-time spending', money(expenses.reduce((sum, item) => sum + item.amount, 0))], ['Expenses recorded', String(expenses.length)]].map(([title, value]) => (
          <Card key={title}><CardContent><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-semibold">{loading || error ? '—' : value}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[340px_1fr]">
        <Card><CardHeader><CardTitle>Add expense</CardTitle></CardHeader><CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" placeholder="e.g. Weekly groceries" required maxLength={200} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="amount">Amount (SAR)</Label><Input id="amount" type="number" min="0.01" max="999999999" step="0.01" placeholder="0.00" required value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="category">Category</Label><select id="category" className={selectClass} required value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((option) => <option key={option}>{option}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" required max={today()} value={date} onChange={(event) => setDate(event.target.value)} /></div>
            <Button className="w-full" type="submit" disabled={saving || loading || !!error}>{saving ? 'Saving…' : 'Add expense'}</Button>
          </form>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Expense history</CardTitle><span className="text-sm text-muted-foreground">{visible.length} entries</span></CardHeader><CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row"><Input aria-label="Search expenses" placeholder="Search expenses…" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filter by category" className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All categories</option>{categories.map((option) => <option key={option}>{option}</option>)}</select></div>
          {loading ? <p role="status" className="py-10 text-center text-muted-foreground">Loading expenses…</p> : error ? <p className="py-10 text-center text-muted-foreground">Expense history is unavailable.</p> : visible.length === 0 ? <p className="py-10 text-center text-muted-foreground">{expenses.length === 0 ? 'No expenses yet. Add your first expense to get started.' : 'No expenses match your filters.'}</p> : (
            <Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>{visible.map((item) => <TableRow key={item.id}><TableCell className="font-medium break-words max-w-64">{item.description}</TableCell><TableCell>{item.category}</TableCell><TableCell className="whitespace-nowrap">{item.date}</TableCell><TableCell className="text-right whitespace-nowrap">{money(item.amount)}</TableCell><TableCell><Button variant="ghost" mode="icon" aria-label={`Delete ${item.description}`} disabled={deleting} onClick={() => void remove(item)}><Trash2 className="size-4" /></Button></TableCell></TableRow>)}</TableBody>
            </Table>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
