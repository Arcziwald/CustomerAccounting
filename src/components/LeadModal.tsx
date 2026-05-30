import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEBHOOK_URL = 'https://n8n.srv1151721.hstgr.cloud/webhook/brakomat-lead';

export default function LeadModal({ isOpen, onClose }: LeadModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', clients: '', employees: '', offices: '' });
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
    setForm({ name: '', email: '', phone: '', clients: '', employees: '', offices: '' });
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
                      {t('lead_modal.badge')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight mb-2">
                    {t('lead_modal.title')}<br />
                    <span className="text-blue-200">{t('lead_modal.title_highlight')}</span>
                  </h2>
                  <p className="text-blue-100/80 text-sm">
                    {t('lead_modal.subtitle')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                      {t('lead_modal.name_label')}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder={t('lead_modal.name_placeholder')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                      {t('lead_modal.email_label')}
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder={t('lead_modal.email_placeholder')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                      {t('lead_modal.phone_label')}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder={t('lead_modal.phone_placeholder')}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                        {t('lead_modal.clients_label')}
                      </label>
                      <select
                        value={form.clients}
                        onChange={e => setForm(p => ({ ...p, clients: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm h-[50px]"
                      >
                        <option value="">{t('lead_modal.how_many')}</option>
                        <option value="<20">{t('lead_modal.clients_lt20')}</option>
                        <option value="20-50">{t('lead_modal.clients_20_50')}</option>
                        <option value="50-100">{t('lead_modal.clients_50_100')}</option>
                        <option value="100+">{t('lead_modal.clients_100plus')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                        {t('lead_modal.employees_label')}
                      </label>
                      <select
                        value={form.employees}
                        onChange={e => setForm(p => ({ ...p, employees: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm h-[50px]"
                      >
                        <option value="">{t('lead_modal.how_many')}</option>
                        <option value="1">{t('lead_modal.employees_solo')}</option>
                        <option value="2-5">{t('lead_modal.employees_2_5')}</option>
                        <option value="6-15">{t('lead_modal.employees_6_15')}</option>
                        <option value="15+">{t('lead_modal.employees_15plus')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5">
                      {t('lead_modal.offices_label')}
                    </label>
                    <select
                      value={form.offices}
                      onChange={e => setForm(p => ({ ...p, offices: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                    >
                      <option value="">{t('lead_modal.how_many')}</option>
                      <option value="1">{t('lead_modal.offices_1')}</option>
                      <option value="2-3">{t('lead_modal.offices_2_3')}</option>
                      <option value="4-10">{t('lead_modal.offices_4_10')}</option>
                      <option value="10+">{t('lead_modal.offices_10plus')}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200/60 disabled:opacity-60 mt-2"
                  >
                    {loading ? t('lead_modal.submitting') : t('lead_modal.submit')}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center pt-1">
                    {t('lead_modal.rodo')}
                  </p>
                </form>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{t('lead_modal.success_title')}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8" style={{ whiteSpace: 'pre-line' }}>
                  {t('lead_modal.success_desc')}
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-700 transition-all"
                >
                  {t('lead_modal.success_btn')}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
