import { describe, it, expect } from 'vitest';
import { podzielFakturyDemo, type FakturaDemo } from './korpo-skrzynka';

const f = (over: Partial<FakturaDemo>): FakturaDemo => ({
  id: '', sprzedawca: 'A', nip: '1', kwota: 100, data: '2026-06-01', wlasciciel: null, zrodlo: null, sugestia: null, ...over,
});

describe('podzielFakturyDemo', () => {
  it('dzieli na sugestie/niczyje/wDochodzeniu/przypisane', () => {
    const faktury = [
      f({ id: 'sug', sugestia: 'd1' }),
      f({ id: 'przyp', wlasciciel: 'd1' }),
      f({ id: 'doch' }),
      f({ id: 'nicz' }),
    ];
    const r = podzielFakturyDemo(faktury, new Set(['doch']));
    expect(r.sugestie.map(x => x.id)).toEqual(['sug']);
    expect(r.przypisane.map(x => x.id)).toEqual(['przyp']);
    expect(r.wDochodzeniu.map(x => x.id)).toEqual(['doch']);
    expect(r.niczyje.map(x => x.id)).toEqual(['nicz']);
  });

  it('przypisana faktura nie trafia do wDochodzeniu mimo wpisu w zbiorze', () => {
    const r = podzielFakturyDemo([f({ id: 'p', wlasciciel: 'd1' })], new Set(['p']));
    expect(r.przypisane.map(x => x.id)).toEqual(['p']);
    expect(r.wDochodzeniu).toEqual([]);
  });
});
