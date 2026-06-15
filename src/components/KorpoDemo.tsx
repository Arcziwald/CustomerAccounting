/**
 * Brakomat Korpo — interaktywne demo (poziom 2: silnik przypisywania + poziom 3: dochodzenie).
 * Strona pokazowa pod sprzedaż korpo (Erbud i podobni). Niedostępna z nawigacji demo biurowego —
 * link podawany bezpośrednio (one-pager / mail). Całość na danych mockowych, stan w pamięci.
 */

import React, { useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowLeft, Briefcase, Building2, Check, ChevronRight, HardHat, Mail, MailQuestion,
  RotateCcw, Route, Truck, X,
} from 'lucide-react';
import LeadModal from './LeadModal';
import { podzielFakturyDemo, type ZakladkaKey } from '../lib/korpo-skrzynka';

type Zrodlo = 'regula' | 'wyuczona' | 'sugestia' | 'reczne';

interface Dzial { id: string; nazwa: string; kierownik: string }
interface Faktura {
  id: string; sprzedawca: string; nip: string; kwota: number; data: string;
  wlasciciel: string | null; zrodlo: Zrodlo | null; sugestia: string | null; opis?: string;
}
interface Regula { nip: string; sprzedawca: string; dzial: string; zrodlo: 'reczna' | 'wyuczona'; trafienia: number }

type ScenKey = 'budowa' | 'transport' | 'nieruchomosci' | 'korpo';

interface Scenariusz {
  nazwa: string;
  firma: string;
  icon: React.ComponentType<{ className?: string }>;
  dzialy: Dzial[];
  faktury: Faktura[];
  reguly: Regula[];
  // Słownik nazewnictwa jednostki rozliczenia — podmieniany w treści per branża
  vocab: {
    celMn: string;       // biernik l.mn., cel zapytania: „Zapytaj budowy" / „…kierowców"
    innaFraza: string;   // „to sprawa innej budowy" / „…innego pojazdu"
    tenSamFraza: string; // „na tę samą budowę" / „do tego samego pojazdu"
    perCo: string;       // biernik lp: „koszty per budowę / pojazd / obiekt / dział"
    jednostka: string;   // mianownik lp: „dostawca → budowa / pojazd / obiekt / dział"
    jednostkaMn: string; // mianownik lmn: „na które budowy / pojazdy / obiekty / działy idzie koszt"
    placeholder: string; // podpowiedź w polu „czego dotyczy zakup"
  };
}

const SCENARIUSZE: Record<ScenKey, Scenariusz> = {
  budowa: {
    nazwa: 'Budownictwo',
    firma: 'GRUPA BUDOMAX S.A.',
    icon: HardHat,
    dzialy: [
      { id: 's7', nazwa: 'Budowa S7 Płońsk', kierownik: 'kier. Tomasz Wrona' },
      { id: 'zacisze', nazwa: 'Budowa Osiedle Zacisze', kierownik: 'kier. Anna Lis' },
      { id: 'wola', nazwa: 'Biurowiec Wola Park', kierownik: 'kier. Piotr Gajda' },
      { id: 'sprzet', nazwa: 'Zaplecze i sprzęt', kierownik: 'Marek Sowa' },
      { id: 'centrala', nazwa: 'Centrala', kierownik: 'Biuro zarządu' },
    ],
    faktury: [
      { id: 'b1', sprzedawca: 'Ramirent Polska (wynajem sprzętu)', nip: '5252243951', kwota: 18450.00, data: '2026-06-02', wlasciciel: 'sprzet', zrodlo: 'regula', sugestia: null },
      { id: 'b2', sprzedawca: 'Ramirent Polska (wynajem sprzętu)', nip: '5252243951', kwota: 9320.50, data: '2026-06-08', wlasciciel: 'sprzet', zrodlo: 'regula', sugestia: null },
      { id: 'b3', sprzedawca: 'Orange Polska S.A.', nip: '5260250995', kwota: 1840.00, data: '2026-06-05', wlasciciel: 'centrala', zrodlo: 'wyuczona', sugestia: null },
      { id: 'b4', sprzedawca: 'Stalprofil S.A. (stal zbrojeniowa)', nip: '6290011681', kwota: 64200.00, data: '2026-06-09', wlasciciel: null, zrodlo: null, sugestia: 's7' },
      { id: 'b5', sprzedawca: 'BHP-Pol (odzież ochronna)', nip: '7791011327', kwota: 4870.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: 'zacisze' },
      { id: 'b6', sprzedawca: 'Betoniarnia CEMEX (beton B30)', nip: '9510014262', kwota: 38900.00, data: '2026-06-09', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'b7', sprzedawca: 'Betoniarnia CEMEX (beton B30)', nip: '9510014262', kwota: 21450.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'b8', sprzedawca: 'Betoniarnia CEMEX (pompa + beton)', nip: '9510014262', kwota: 12780.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'b9', sprzedawca: 'Geodezja-Pro (tyczenie obiektu)', nip: '5213334455', kwota: 6150.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
    ],
    reguly: [
      { nip: '5252243951', sprzedawca: 'Ramirent Polska', dzial: 'sprzet', zrodlo: 'reczna', trafienia: 7 },
      { nip: '5260250995', sprzedawca: 'Orange Polska', dzial: 'centrala', zrodlo: 'wyuczona', trafienia: 12 },
    ],
    vocab: { celMn: 'budowy', innaFraza: 'innej budowy', tenSamFraza: 'na tę samą budowę',
             perCo: 'budowę', jednostka: 'budowa', jednostkaMn: 'budowy', placeholder: 'np. beton na strop poziomu 2, zamówienie awaryjne' },
  },
  transport: {
    nazwa: 'Transport',
    firma: 'TRANSGÓRA Logistyka Sp. z o.o.',
    icon: Truck,
    dzialy: [
      { id: 'wgm4521', nazwa: 'Zestaw WGM 4521 (Kowalczyk)', kierownik: 'kier. Daniel Kowalczyk' },
      { id: 'wgm7788', nazwa: 'Zestaw WGM 7788 (Nowak)', kierownik: 'kier. Sławomir Nowak' },
      { id: 'busy', nazwa: 'Flota dostawcza (busy)', kierownik: 'dysp. Renata Pawlak' },
      { id: 'warsztat', nazwa: 'Warsztat i serwis', kierownik: 'Marek Stocki' },
      { id: 'centrala', nazwa: 'Centrala / dyspozytornia', kierownik: 'Biuro zarządu' },
    ],
    faktury: [
      { id: 't1', sprzedawca: 'Inter Cars S.A. (części)', nip: '5252097454', kwota: 8740.00, data: '2026-06-02', wlasciciel: 'warsztat', zrodlo: 'regula', sugestia: null },
      { id: 't2', sprzedawca: 'Inter Cars S.A. (części)', nip: '5252097454', kwota: 3120.00, data: '2026-06-08', wlasciciel: 'warsztat', zrodlo: 'regula', sugestia: null },
      { id: 't3', sprzedawca: 'Orange Polska S.A.', nip: '5260250995', kwota: 1290.00, data: '2026-06-05', wlasciciel: 'centrala', zrodlo: 'wyuczona', sugestia: null },
      { id: 't4', sprzedawca: 'PKN Orlen (karta paliwowa)', nip: '7740001454', kwota: 9850.00, data: '2026-06-09', wlasciciel: null, zrodlo: null, sugestia: 'wgm4521' },
      { id: 't5', sprzedawca: 'BP Europa (karta paliwowa)', nip: '5272308545', kwota: 7430.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: 'wgm7788' },
      { id: 't6', sprzedawca: 'PKN Orlen (karta paliwowa)', nip: '7740001454', kwota: 4120.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 't7', sprzedawca: 'GITD e-TOLL (opłaty drogowe)', nip: '5262311348', kwota: 5680.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 't8', sprzedawca: 'Continental Opony (ogumienie)', nip: '8990107208', kwota: 12300.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 't9', sprzedawca: 'Myjnia TIR Stryków', nip: '7282765352', kwota: 980.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
    ],
    reguly: [
      { nip: '5252097454', sprzedawca: 'Inter Cars', dzial: 'warsztat', zrodlo: 'reczna', trafienia: 8 },
      { nip: '5260250995', sprzedawca: 'Orange Polska', dzial: 'centrala', zrodlo: 'wyuczona', trafienia: 11 },
    ],
    vocab: { celMn: 'kierowców', innaFraza: 'innego pojazdu', tenSamFraza: 'do tego samego pojazdu',
             perCo: 'pojazd', jednostka: 'pojazd', jednostkaMn: 'pojazdy', placeholder: 'np. tankowanie w trasie Gdańsk–Wrocław, naczepa-chłodnia' },
  },
  nieruchomosci: {
    nazwa: 'Nieruchomości',
    firma: 'DOMENA Zarządzanie Nieruchomościami Sp. z o.o.',
    icon: Building2,
    dzialy: [
      { id: 'galeria', nazwa: 'Galeria Saska (C.H.)', kierownik: 'zarządca Ewa Tomczyk' },
      { id: 'atrium', nazwa: 'Biurowiec Atrium Plaza', kierownik: 'zarządca Robert Kania' },
      { id: 'osiedle', nazwa: 'Osiedle Słoneczne (wspólnota)', kierownik: 'adm. Joanna Bąk' },
      { id: 'magazyn', nazwa: 'Park magazynowy A2', kierownik: 'zarządca Piotr Lis' },
      { id: 'centrala', nazwa: 'Centrala / zarząd', kierownik: 'Biuro zarządu' },
    ],
    faktury: [
      { id: 'n1', sprzedawca: 'Impel Facility (sprzątanie)', nip: '8990010807', kwota: 11200.00, data: '2026-06-02', wlasciciel: 'galeria', zrodlo: 'regula', sugestia: null },
      { id: 'n2', sprzedawca: 'Impel Facility (sprzątanie)', nip: '8990010807', kwota: 6800.00, data: '2026-06-08', wlasciciel: 'galeria', zrodlo: 'regula', sugestia: null },
      { id: 'n3', sprzedawca: 'Orange Polska S.A.', nip: '5260250995', kwota: 1740.00, data: '2026-06-05', wlasciciel: 'centrala', zrodlo: 'wyuczona', sugestia: null },
      { id: 'n4', sprzedawca: 'Veolia (ciepło systemowe)', nip: '5272681045', kwota: 18900.00, data: '2026-06-09', wlasciciel: null, zrodlo: null, sugestia: 'atrium' },
      { id: 'n5', sprzedawca: 'PGE Obrót (energia el.)', nip: '8133173052', kwota: 24600.00, data: '2026-06-09', wlasciciel: null, zrodlo: null, sugestia: 'galeria' },
      { id: 'n6', sprzedawca: 'KONE (serwis dźwigów)', nip: '5220010334', kwota: 7350.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'n7', sprzedawca: 'Veolia (ciepło systemowe)', nip: '5272681045', kwota: 9420.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'n8', sprzedawca: 'Saur Neptun (woda i ścieki)', nip: '5832025396', kwota: 5180.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'n9', sprzedawca: 'ZIELNIK (pielęgnacja zieleni)', nip: '7393557632', kwota: 2640.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
    ],
    reguly: [
      { nip: '8990010807', sprzedawca: 'Impel Facility', dzial: 'galeria', zrodlo: 'reczna', trafienia: 6 },
      { nip: '5260250995', sprzedawca: 'Orange Polska', dzial: 'centrala', zrodlo: 'wyuczona', trafienia: 9 },
    ],
    vocab: { celMn: 'zarządców', innaFraza: 'innego obiektu', tenSamFraza: 'do tego samego obiektu',
             perCo: 'obiekt', jednostka: 'obiekt', jednostkaMn: 'obiekty', placeholder: 'np. wymiana opraw LED w garażu -1, Galeria Saska' },
  },
  korpo: {
    nazwa: 'Usługi / biuro',
    firma: 'NORDPOL GROUP Sp. z o.o.',
    icon: Briefcase,
    dzialy: [
      { id: 'it', nazwa: 'Dział IT', kierownik: 'kier. Karol Mazur' },
      { id: 'marketing', nazwa: 'Marketing', kierownik: 'kier. Ewa Kruk' },
      { id: 'serwis', nazwa: 'Serwis i utrzymanie', kierownik: 'kier. Adam Bielik' },
      { id: 'logistyka', nazwa: 'Logistyka', kierownik: 'kier. Magda Wilk' },
      { id: 'admin', nazwa: 'Administracja', kierownik: 'Biuro zarządu' },
    ],
    faktury: [
      { id: 'k1', sprzedawca: 'Microsoft Ireland (licencje M365)', nip: '5263326050', kwota: 14820.00, data: '2026-06-01', wlasciciel: 'it', zrodlo: 'regula', sugestia: null },
      { id: 'k2', sprzedawca: 'Microsoft Ireland (Azure)', nip: '5263326050', kwota: 8940.00, data: '2026-06-07', wlasciciel: 'it', zrodlo: 'regula', sugestia: null },
      { id: 'k3', sprzedawca: 'Securitas Polska (ochrona)', nip: '5261039762', kwota: 6200.00, data: '2026-06-05', wlasciciel: 'admin', zrodlo: 'wyuczona', sugestia: null },
      { id: 'k4', sprzedawca: 'Orange Polska S.A.', nip: '5260250995', kwota: 3410.00, data: '2026-06-08', wlasciciel: null, zrodlo: null, sugestia: 'it' },
      { id: 'k5', sprzedawca: 'InPost (kurier — paczki)', nip: '6793087624', kwota: 2780.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: 'logistyka' },
      { id: 'k6', sprzedawca: 'Lyreco (materiały biurowe)', nip: '5212872227', kwota: 1980.00, data: '2026-06-09', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'k7', sprzedawca: 'Lyreco (materiały biurowe)', nip: '5212872227', kwota: 3640.00, data: '2026-06-10', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'k8', sprzedawca: 'Lyreco (tonery + papier)', nip: '5212872227', kwota: 2210.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
      { id: 'k9', sprzedawca: 'Restauracja Stary Młyn (usługa gastronomiczna)', nip: '7811899202', kwota: 2450.00, data: '2026-06-11', wlasciciel: null, zrodlo: null, sugestia: null },
    ],
    reguly: [
      { nip: '5263326050', sprzedawca: 'Microsoft Ireland', dzial: 'it', zrodlo: 'reczna', trafienia: 9 },
      { nip: '5261039762', sprzedawca: 'Securitas Polska', dzial: 'admin', zrodlo: 'wyuczona', trafienia: 5 },
    ],
    vocab: { celMn: 'działy', innaFraza: 'innego działu', tenSamFraza: 'do tego samego działu',
             perCo: 'dział', jednostka: 'dział', jednostkaMn: 'działy', placeholder: 'np. spotkanie z klientem strategicznym, 8 osób' },
  },
};

const ZRODLO_BADGE: Record<Zrodlo, { cls: string; label: string }> = {
  regula:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'reguła' },
  wyuczona: { cls: 'bg-violet-50 text-violet-700 border-violet-200',    label: 'automatyczna' },
  sugestia: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'sugestia' },
  reczne:   { cls: 'bg-slate-100 text-slate-600 border-slate-200',      label: 'ręczne' },
};

const zl = (n: number) => n.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';

// Stan dochodzenia jednej faktury: kolejka kandydatów + ich odpowiedzi
interface Dochodzenie {
  fakturaId: string;
  kolejka: string[];           // działy, które jeszcze nie odpowiedziały
  zaprzeczyli: string[];       // działy, które odpowiedziały „nie nasze"
  aktywny: string | null;      // dział, którego mail/stronę właśnie oglądamy
  widok: 'mail' | 'strona';
}

export default function KorpoDemo() {
  const [scenKey, setScenKey] = useState<ScenKey>('budowa');
  const scen = SCENARIUSZE[scenKey];

  const [faktury, setFaktury] = useState<Faktura[]>(scen.faktury);
  const [reguly, setReguly] = useState<Regula[]>(scen.reguly);
  const [reczne, setReczne] = useState<Record<string, string[]>>({}); // nip -> działy ręcznych przypisań (uczenie)
  const [wybor, setWybor] = useState<Record<string, string>>({});
  const [dochodzenieOpen, setDochodzenieOpen] = useState<string | null>(null); // faktura z otwartym wyborem kandydatów
  const [kandydaci, setKandydaci] = useState<Set<string>>(new Set());
  const [doch, setDoch] = useState<Dochodzenie | null>(null);
  const [opis, setOpis] = useState('');
  const [przekazDo, setPrzekazDo] = useState('');
  const [trybOdp, setTrybOdp] = useState<'wybor' | 'moje' | 'przekaz'>('wybor');
  const [alertBiuro, setAlertBiuro] = useState<string | null>(null); // fakturaId po komplecie zaprzeczeń
  const [showLead, setShowLead] = useState(false);
  const [zakladka, setZakladka] = useState<ZakladkaKey>('sugestie');

  const resetuj = (key: ScenKey) => {
    const s = SCENARIUSZE[key];
    setScenKey(key);
    setFaktury(s.faktury.map(f => ({ ...f })));
    setReguly(s.reguly.map(r => ({ ...r })));
    setReczne({}); setWybor({}); setDochodzenieOpen(null); setKandydaci(new Set());
    setDoch(null); setOpis(''); setPrzekazDo(''); setTrybOdp('wybor'); setAlertBiuro(null);
    setZakladka('sugestie');
  };

  const dzial = (id: string | null) => scen.dzialy.find(d => d.id === id);
  const dzialName = (id: string | null) => dzial(id)?.nazwa ?? '—';

  // Podział na zakładki. W demie „w dochodzeniu" = faktura po komplecie zaprzeczeń
  // (alertBiuro), wciąż nieprzypisana — aktywne dochodzenie przejmuje cały ekran,
  // więc nie ma innej trwałej listy „w toku".
  const wDochodzeniuIds = new Set<string>(alertBiuro ? [alertBiuro] : []);
  const { sugestie, niczyje, wDochodzeniu, przypisane } = podzielFakturyDemo(faktury, wDochodzeniuIds);
  const liczby: Record<ZakladkaKey, number> = {
    sugestie: sugestie.length, niczyje: niczyje.length, wDochodzeniu: wDochodzeniu.length, przypisane: przypisane.length,
  };
  const widoczne = { sugestie, niczyje, wDochodzeniu, przypisane }[zakladka];
  const stats = useMemo(() => {
    const total = faktury.length;
    const przyp = faktury.filter(f => f.wlasciciel).length;
    const auto = faktury.filter(f => f.zrodlo === 'regula' || f.zrodlo === 'wyuczona').length;
    return { total, przyp, auto, procent: total ? Math.round((przyp / total) * 100) : 0 };
  }, [faktury]);

  // Sygnał uczący: 2 zgodne ręczne przypisania tego samego NIP → reguła wyuczona + retro
  const naucz = (nip: string, dzialId: string, sprzedawca: string) => {
    if (reguly.some(r => r.nip === nip)) return;
    const historia = [...(reczne[nip] ?? []), dzialId];
    setReczne(prev => ({ ...prev, [nip]: historia }));
    const zgodne = historia.filter(d => d === dzialId).length;
    if (zgodne >= 2) {
      setReguly(prev => [...prev, { nip, sprzedawca: sprzedawca.replace(/\s*\(.*\)/, ''), dzial: dzialId, zrodlo: 'wyuczona', trafienia: zgodne }]);
      let retro = 0;
      setFaktury(prev => prev.map(f => {
        if (!f.wlasciciel && f.nip === nip) { retro++; return { ...f, wlasciciel: dzialId, zrodlo: 'wyuczona' as Zrodlo, sugestia: null }; }
        return f;
      }));
      toast.success(
        <div className="text-sm"><b>Reguła gotowa!</b><br />
        {`${sprzedawca.replace(/\s*\(.*\)/, '')} → ${dzialName(dzialId)}. `}
        Pozostałe faktury tego dostawcy przypisane automatycznie — kolejne będą przypisywać się same.</div>,
        { duration: 7000, icon: '✅', style: { borderRadius: '14px', maxWidth: '420px' } }
      );
      return;
    }
    toast.success('Przypisane. Powtórz ten sam wybór dla tego dostawcy, a Brakomat zacznie przypisywać go automatycznie.', { style: { borderRadius: '14px' } });
  };

  const przypisz = (fakturaId: string, dzialId: string, zrodlo: Zrodlo, opisZakupu?: string) => {
    const f = faktury.find(x => x.id === fakturaId);
    if (!f) return;
    setFaktury(prev => prev.map(x => x.id === fakturaId
      ? { ...x, wlasciciel: dzialId, zrodlo, sugestia: null, opis: opisZakupu }
      : x));
    if (zrodlo === 'reczne') naucz(f.nip, dzialId, f.sprzedawca);
    else toast.success('Sugestia potwierdzona — utworzono regułę dla tego dostawcy.', { style: { borderRadius: '14px' } });
    if (zrodlo === 'sugestia') {
      setReguly(prev => prev.some(r => r.nip === f.nip) ? prev
        : [...prev, { nip: f.nip, sprzedawca: f.sprzedawca.replace(/\s*\(.*\)/, ''), dzial: dzialId, zrodlo: 'reczna', trafienia: 1 }]);
    }
  };

  // ── Dochodzenie ──────────────────────────────────────────────────────────
  const startDochodzenie = (fakturaId: string) => {
    const wybrani = [...kandydaci];
    setDoch({ fakturaId, kolejka: wybrani, zaprzeczyli: [], aktywny: wybrani[0], widok: 'mail' });
    setDochodzenieOpen(null); setKandydaci(new Set());
    setTrybOdp('wybor'); setOpis(''); setPrzekazDo('');
    toast.success(`Wysłano ${wybrani.length} ${wybrani.length === 1 ? 'zapytanie' : 'zapytania'} mailem — każdy kierownik dostał swój magic-link.`, { style: { borderRadius: '14px' } });
  };

  const odpowiedz = (akcja: 'moje' | 'nie_moje' | 'przekaz') => {
    if (!doch || !doch.aktywny) return;
    const f = faktury.find(x => x.id === doch.fakturaId)!;

    if (akcja === 'moje') {
      przypisz(doch.fakturaId, doch.aktywny, 'reczne', opis.trim());
      setDoch(null); setTrybOdp('wybor'); setOpis('');
      return;
    }
    if (akcja === 'nie_moje') {
      const zaprzeczyli = [...doch.zaprzeczyli, doch.aktywny];
      const kolejka = doch.kolejka.filter(d => d !== doch.aktywny);
      if (kolejka.length === 0) {
        setDoch(null); setAlertBiuro(doch.fakturaId);
        toast(`Wszyscy zapytani zaprzeczyli — księgowość dostaje alert mailem.`, { icon: '📨', style: { borderRadius: '14px' } });
      } else {
        setDoch({ ...doch, kolejka, zaprzeczyli, aktywny: kolejka[0], widok: 'mail' });
        toast(`„${dzialName(zaprzeczyli[zaprzeczyli.length - 1])}" odpowiedział: to nie nasze. Kolejny mail czeka u „${dzialName(kolejka[0])}".`, { icon: '✉️', style: { borderRadius: '14px' } });
      }
      setTrybOdp('wybor'); setOpis('');
      return;
    }
    // przekaz
    if (!przekazDo) return;
    const kolejka = [...doch.kolejka.filter(d => d !== doch.aktywny), przekazDo];
    setDoch({ ...doch, kolejka, aktywny: przekazDo, widok: 'mail' });
    toast(`„${dzialName(doch.aktywny)}" przekazał pytanie — „${dzialName(przekazDo)}" właśnie dostał mail.`, { icon: '➡️', style: { borderRadius: '14px' } });
    setTrybOdp('wybor'); setPrzekazDo(''); setOpis('');
  };

  // ── Widok: mail u kierownika ─────────────────────────────────────────────
  if (doch && doch.widok === 'mail') {
    const f = faktury.find(x => x.id === doch.fakturaId)!;
    const d = dzial(doch.aktywny)!;
    return (
      <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <Toaster position="top-right" />
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-slate-500 mb-3">
            <Mail className="w-4 h-4 inline mr-1" />
            Tak wygląda mail w skrzynce: <b>{d.kierownik}</b> ({d.nazwa}). Zero logowania, zero szkoleń — kliknij tak, jak on:
          </p>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs text-slate-500">
              <p><b className="text-slate-700">Od:</b> Brakomat &lt;noreply@mailing.artwebcraft.com&gt;</p>
              <p><b className="text-slate-700">Do:</b> {d.kierownik.toLowerCase().replace(/[^a-ząćęłńóśźż ]/g, '').trim().split(' ').pop()}@{scen.firma.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')}.pl</p>
              <p><b className="text-slate-700">Temat:</b> Faktura do wyjaśnienia: {f.sprzedawca.replace(/\s*\(.*\)/, '')} {zl(f.kwota)}</p>
            </div>
            <div className="p-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-2">Czy to zakup Waszego zespołu?</h2>
              <p className="text-sm text-slate-600 mb-4">Dzień dobry,<br />księgowość ustala, czyj jest poniższy zakup. Faktura wpłynęła przez KSeF bez wskazania zamawiającego.</p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm mb-5">
                <div className="flex justify-between py-1"><span className="text-slate-500">Sprzedawca</span><span className="font-semibold">{f.sprzedawca}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-500">NIP</span><span>{f.nip}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-500">Kwota</span><span className="font-bold">{zl(f.kwota)}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-500">Data</span><span>{new Date(f.data).toLocaleDateString('pl-PL')}</span></div>
              </div>
              <button onClick={() => setDoch({ ...doch, widok: 'strona' })}
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition">
                Odpowiedz (zajmie 30 sekund)
              </button>
              <p className="text-xs text-slate-400 mt-4">Trzy możliwe odpowiedzi: „to nasz zakup", „to nie nasze", „to sprawa {scen.vocab.innaFraza}".
              Bez logowania. Brak odpowiedzi w ciągu 2 dni trafi do księgowości jako sprawa otwarta.</p>
            </div>
          </div>
          <button onClick={() => setDoch(null)} className="mt-4 mx-auto flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Wróć do panelu księgowości
          </button>
        </div>
      </main>
    );
  }

  // ── Widok: strona odpowiedzi (magic-link) ────────────────────────────────
  if (doch && doch.widok === 'strona') {
    const f = faktury.find(x => x.id === doch.fakturaId)!;
    const d = dzial(doch.aktywny)!;
    const inne = scen.dzialy.filter(x => x.id !== doch.aktywny && !doch.zaprzeczyli.includes(x.id));
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 max-w-lg w-full">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-1">Brakomat · faktura do wyjaśnienia</p>
          <h1 className="text-xl font-extrabold text-slate-900 mb-1">Czy to zakup zespołu „{d.nazwa}"?</h1>
          <p className="text-sm text-slate-500 mb-4">Faktura wpłynęła przez KSeF bez wskazania zamawiającego.</p>
          <div className="bg-slate-50 rounded-2xl p-4 mb-5 text-sm">
            <div className="flex justify-between py-1"><span className="text-slate-500">Sprzedawca</span><span className="font-semibold text-right">{f.sprzedawca}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500">NIP</span><span>{f.nip}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500">Kwota</span><span className="font-bold">{zl(f.kwota)}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500">Data</span><span>{new Date(f.data).toLocaleDateString('pl-PL')}</span></div>
          </div>

          {trybOdp === 'wybor' && (
            <div className="space-y-2">
              <button onClick={() => setTrybOdp('moje')}
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Tak, to nasz zakup
              </button>
              <button onClick={() => odpowiedz('nie_moje')}
                className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Nie, to nie nasze
              </button>
              <button onClick={() => setTrybOdp('przekaz')}
                className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center gap-2">
                <ChevronRight className="w-4 h-4" /> To sprawa {scen.vocab.innaFraza}
              </button>
            </div>
          )}

          {trybOdp === 'moje' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Czego dotyczy ten zakup? <span className="font-normal text-slate-400">(wymagane — księgowość musi wiedzieć)</span>
                <textarea value={opis} onChange={e => setOpis(e.target.value)} rows={2}
                  placeholder={scen.vocab.placeholder}
                  className="mt-1 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <button onClick={() => odpowiedz('moje')} disabled={!opis.trim()}
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Potwierdzam — nasz zakup
              </button>
              <button onClick={() => setTrybOdp('wybor')} className="w-full text-xs text-slate-400 hover:text-slate-600">← wróć</button>
            </div>
          )}

          {trybOdp === 'przekaz' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Który zespół powinien dostać to pytanie?
                <select value={przekazDo} onChange={e => setPrzekazDo(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Wybierz…</option>
                  {inne.map(x => <option key={x.id} value={x.id}>{x.nazwa}</option>)}
                </select>
              </label>
              <button onClick={() => odpowiedz('przekaz')} disabled={!przekazDo}
                className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <ChevronRight className="w-4 h-4" /> Przekaż pytanie
              </button>
              <button onClick={() => setTrybOdp('wybor')} className="w-full text-xs text-slate-400 hover:text-slate-600">← wróć</button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── Widok główny: panel księgowości ─────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-100">
      <Toaster position="top-right" />
      <LeadModal isOpen={showLead} onClose={() => setShowLead(false)} />

      {/* Pasek demo */}
      <div className="bg-slate-900 text-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-sky-400" />
            <span className="font-bold">Brakomat Korpo</span>
            <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">demo interaktywne</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-0.5 hidden sm:inline">branża:</span>
            {(Object.keys(SCENARIUSZE) as ScenKey[]).map(key => {
              const s = SCENARIUSZE[key];
              const Ikona = s.icon;
              return (
                <button key={key} onClick={() => resetuj(key)}
                  className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${scenKey === key ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  <Ikona className="w-3.5 h-3.5" /> {s.nazwa}
                </button>
              );
            })}
            <button onClick={() => resetuj(scenKey)} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Od nowa
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Intro */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-5">
          <h1 className="text-xl font-extrabold text-slate-900">Faktury z KSeF spływają do centrali. Ale kto je zamówił?</h1>
          <p className="text-sm text-slate-600 mt-2">
            To panel księgowości firmy <b>{scen.firma}</b>. KSeF dostarcza faktury bez wskazania zamawiającego — „pula niczyja" rośnie.
            Brakomat przypisuje właścicieli kosztów automatycznie, a gdy nie wie — <b>pyta {scen.vocab.celMn} mailem zamiast księgowej</b>. Wypróbuj:
          </p>
          <ol className="text-sm text-slate-600 mt-3 space-y-1 list-decimal list-inside">
            <li><b>Potwierdź sugestię</b> jednym kliknięciem — Brakomat podpowiada na podstawie wcześniejszych przypisań.</li>
            <li>Przy niczyjej fakturze kliknij <b>„Zapytaj {scen.vocab.celMn}"</b> — zobaczysz mail i odpowiedź oczami kierownika, bez logowania.</li>
            <li>Przypisz <b>dwie faktury tego samego dostawcy</b> {scen.vocab.tenSamFraza} — Brakomat od tej pory przypisze je automatycznie.</li>
          </ol>
        </div>

        {/* Metryki */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-blue-600 rounded-2xl p-4 text-white">
            <p className="text-3xl font-extrabold">{stats.procent}%</p>
            <p className="text-xs opacity-80 mt-1">faktur z przypisanym właścicielem kosztu</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <p className="text-2xl font-bold text-blue-700">{stats.auto}</p>
            <p className="text-xs text-slate-500 mt-1">przypisane automatycznie</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-2xl font-bold text-amber-600">{niczyje.length + wDochodzeniu.length}</p>
            <p className="text-xs text-amber-700 mt-1">pula niczyja: {niczyje.length + wDochodzeniu.length} z {stats.total}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <p className="text-2xl font-bold text-slate-700">{reguly.length}</p>
            <p className="text-xs text-slate-500 mt-1">reguł automatycznego przypisania</p>
          </div>
        </div>

        {/* Alert „wszyscy zaprzeczyli" */}
        {alertBiuro && (() => { const f = faktury.find(x => x.id === alertBiuro); return f && !f.wlasciciel ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-5 text-sm text-rose-800 flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 shrink-0" />
            <span><b>Alert do księgowości:</b> wszyscy zapytani zaprzeczyli przy fakturze {f.sprzedawca} ({zl(f.kwota)}).
            W realnym systemie ten mail właśnie wylądował w skrzynce biura — możesz dopytać pozostałych albo przypisać ręcznie poniżej.</span>
          </div>
        ) : null; })()}

        {/* Skrzynka triażu — zakładki po statusie */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-5">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 mb-4">
            {([
              ['sugestie', 'Sugerowane'], ['niczyje', 'Niczyje'],
              ['wDochodzeniu', 'W dochodzeniu'], ['przypisane', 'Przypisane'],
            ] as [ZakladkaKey, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setZakladka(key)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                  zakladka === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                {label} <span className="text-xs opacity-70">{liczby[key]}</span>
              </button>
            ))}
          </div>

          <div className="space-y-0 max-h-[460px] overflow-y-auto">
            {widoczne.length === 0 && (
              <p className="text-center text-slate-400 italic py-6 text-sm">Brak faktur w tej zakładce</p>
            )}
            {widoczne.map(f => (
              <div key={f.id} className="py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{f.sprzedawca}</p>
                    <p className="text-xs text-slate-500">{new Date(f.data).toLocaleDateString('pl-PL')} · NIP {f.nip} · {zl(f.kwota)}{f.opis ? <> · <i>„{f.opis}"</i></> : null}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {zakladka === 'sugestie' && (
                      <>
                        <span className="text-xs text-slate-600">sugestia: <b>{dzialName(f.sugestia)}</b></span>
                        <button onClick={() => przypisz(f.id, f.sugestia!, 'sugestia')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Potwierdź
                        </button>
                      </>
                    )}
                    {zakladka === 'niczyje' && (
                      <>
                        <button onClick={() => { setDochodzenieOpen(dochodzenieOpen === f.id ? null : f.id); setKandydaci(new Set()); }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 flex items-center gap-1">
                          <MailQuestion className="w-3.5 h-3.5" /> Zapytaj {scen.vocab.celMn}
                        </button>
                        <select value={wybor[f.id] ?? ''}
                          onChange={e => { setWybor(p => ({ ...p, [f.id]: e.target.value })); if (e.target.value) przypisz(f.id, e.target.value, 'reczne'); }}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600">
                          <option value="">Przypisz do…</option>
                          {scen.dzialy.map(d => <option key={d.id} value={d.id}>{d.nazwa}</option>)}
                        </select>
                      </>
                    )}
                    {zakladka === 'wDochodzeniu' && (
                      <>
                        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">wszyscy zaprzeczyli</span>
                        <select value={wybor[f.id] ?? ''}
                          onChange={e => { setWybor(p => ({ ...p, [f.id]: e.target.value })); if (e.target.value) przypisz(f.id, e.target.value, 'reczne'); }}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600">
                          <option value="">Przypisz do…</option>
                          {scen.dzialy.map(d => <option key={d.id} value={d.id}>{d.nazwa}</option>)}
                        </select>
                      </>
                    )}
                    {zakladka === 'przypisane' && (() => {
                      const badge = ZRODLO_BADGE[f.zrodlo ?? 'reczne'];
                      return (
                        <>
                          <span className="text-xs font-semibold text-slate-700">{dzialName(f.wlasciciel)}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {zakladka === 'niczyje' && dochodzenieOpen === f.id && (
                  <div className="mt-2 bg-white rounded-xl border border-sky-200 p-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Kto mógł zamówić? Każdy wybrany dostanie mail z magic-linkiem:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {scen.dzialy.map(d => (
                        <label key={d.id} className={`text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer select-none ${kandydaci.has(d.id) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                          <input type="checkbox" className="hidden" checked={kandydaci.has(d.id)}
                            onChange={() => setKandydaci(prev => { const s = new Set(prev); s.has(d.id) ? s.delete(d.id) : s.add(d.id); return s; })} />
                          {d.nazwa}
                        </label>
                      ))}
                    </div>
                    <button onClick={() => startDochodzenie(f.id)} disabled={kandydaci.size === 0}
                      className="text-xs px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 flex items-center gap-1">
                      <MailQuestion className="w-3 h-3" /> Wyślij zapytania ({kandydaci.size})
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cała pula niczyja rozwiązana */}
        {liczby.sugestie + liczby.niczyje + liczby.wDochodzeniu === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-5 text-center">
            <p className="text-lg font-extrabold text-emerald-800">100% faktur ma właściciela kosztu 🎉</p>
            <p className="text-sm text-emerald-700 mt-1">Dokładnie o to chodzi: księgowość nie goni nikogo telefonami, a kontroling widzi koszty per {scen.vocab.perCo} od ręki.</p>
            <button onClick={() => setShowLead(true)} className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">
              Chcę tak u siebie — umów rozmowę
            </button>
          </div>
        )}

        {/* Reguły */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-5">
          <h3 className="text-sm font-bold text-slate-600 mb-2">Reguły przypisania: dostawca → {scen.vocab.jednostka} ({reguly.length})</h3>
          <div className="bg-slate-50 rounded-2xl px-4 py-1">
            {reguly.map(r => (
              <div key={r.nip} className="flex flex-wrap items-center gap-2 py-2.5 border-b border-slate-200 last:border-0">
                <span className="text-xs font-mono text-slate-600">{r.nip}</span>
                <span className="text-xs text-slate-400">→</span>
                <span className="text-xs font-semibold text-slate-700">{dzialName(r.dzial)}</span>
                <span className="text-xs text-slate-500">({r.sprzedawca})</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${r.zrodlo === 'wyuczona' ? ZRODLO_BADGE.wyuczona.cls : ZRODLO_BADGE.regula.cls}`}>
                  {r.zrodlo === 'wyuczona' ? 'automatyczna' : 'ręczna'}
                </span>
                <span className="text-[11px] text-slate-400">{r.trafienia} {r.trafienia === 1 ? 'trafienie' : 'trafienia'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-center mb-6">
          <h3 className="text-xl font-extrabold text-white">Mniej faktur „niczyich" = mniej godzin księgowości na detektywistykę</h3>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl mx-auto">
            Brakomat nie zastępuje Waszego obiegu dokumentów — <b>karmi go danymi, których KSeF nie dostarcza</b>:
            kto zamówił, czego dotyczy zakup, na które {scen.vocab.jednostkaMn} idzie koszt.
          </p>
          <button onClick={() => setShowLead(true)}
            className="mt-5 px-6 py-3 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition">
            Porozmawiajmy o pilocie w Twojej firmie
          </button>
        </div>
      </div>
    </main>
  );
}
