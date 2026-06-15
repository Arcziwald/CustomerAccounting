// Czysta logika podziału list dla demo Korpo. Bez React.
// UWAGA: typ odzwierciedla kształt danych w KorpoDemo.tsx (wlasciciel/sugestia/zrodlo).

export type ZrodloDemo = 'regula' | 'wyuczona' | 'sugestia' | 'reczne';

export interface FakturaDemo {
  id: string; sprzedawca: string; nip: string; kwota: number; data: string;
  wlasciciel: string | null; zrodlo: ZrodloDemo | null; sugestia: string | null; opis?: string;
}

export type ZakladkaKey = 'sugestie' | 'niczyje' | 'wDochodzeniu' | 'przypisane';

export interface PodzialDemo {
  sugestie: FakturaDemo[]; niczyje: FakturaDemo[]; wDochodzeniu: FakturaDemo[]; przypisane: FakturaDemo[];
}

export function podzielFakturyDemo(faktury: FakturaDemo[], wDochodzeniuIds: Set<string>): PodzialDemo {
  const sugestie: FakturaDemo[] = [];
  const niczyje: FakturaDemo[] = [];
  const wDochodzeniu: FakturaDemo[] = [];
  const przypisane: FakturaDemo[] = [];
  for (const f of faktury) {
    if (f.wlasciciel) { przypisane.push(f); continue; }
    if (f.sugestia) { sugestie.push(f); continue; }
    if (wDochodzeniuIds.has(f.id)) { wDochodzeniu.push(f); continue; }
    niczyje.push(f);
  }
  return { sugestie, niczyje, wDochodzeniu, przypisane };
}
