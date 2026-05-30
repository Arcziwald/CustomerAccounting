import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Sparkles } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEBHOOK_URL = 'https://n8n.srv1151721.hstgr.cloud/webhook/brakomat-lead';

export default function LeadModal({ isOpen, onClose }: LeadModalProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', clients: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'brakomat-demo', timestamp: new Date().toISOString() }),
      });
    } catch {
      // Even if webhook fails, show success
    }
    setLoading(false);
    setSuccess(true);
  };

  const handleClose = () => {
    setSuccess(false);
    setForm({ name: '', email: '', phone: '', clients: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {!success ? (
              <>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10" />
                  <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
                      Brakomat dla Twojego biura
                    </span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight mb-2">
                    Chcę to wdrożyć<br />
                    <span className="text-blue-200">u siebie</span>
                  </h2>
                  <p className="text-blue-100/80 text-sm">
                    Zostaw kontakt — odezwiemy się w ciągu 24h
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                      Imię i nazwisko *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Anna Kowalska"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                      Email służbowy *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="anna@biuro-rachunkowe.pl"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+48 600 000 000"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                        Liczba klientów
                      </label>
                      <select
                        value={form.clients}
                        onChange={e => setForm(p => ({ ...p, clients: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm h-[50px]"
                      >
                        <option value="">Ile?</option>
                        <option value="<20">Mniej niż 20</option>
                        <option value="20-50">20–50</option>
                        <option value="50-100">50–100</option>
                        <option value="100+">100+</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200/60 disabled:opacity-60 mt-2"
                  >
                    {loading ? 'Wysyłanie...' : 'Wyślij zapytanie →'}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center pt-1">
                    Dane chronione zgodnie z RODO. Nie wysyłamy spamu.
                  </p>
                </form>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Gotowe!</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  Twoje zapytanie dotarło do nas.<br />
                  Odezwiemy się w ciągu <strong>24h</strong> roboczych.
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-700 transition-all"
                >
                  Wróć do demo
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
