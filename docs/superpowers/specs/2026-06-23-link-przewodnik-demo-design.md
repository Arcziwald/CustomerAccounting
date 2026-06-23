# Spec: link do przewodnik-demo z aplikacji demo

**Data:** 2026-06-23
**Projekt:** customeraccounting (demo Brakomatu, live: client.accounting.artwebcraft.com)

## Problem
`public/przewodnik-demo.html` jest live, ale nic z samej aplikacji demo do niego nie prowadzi — ewaluator nie wie, że istnieje.

## Cel
Podlinkować przewodnik-demo z dwóch miejsc aplikacji, tak by trafić do ewaluatora i przy wejściu, i w trakcie korzystania.

## Zakres (zatwierdzony)
Dwa linki w `src/components/Dashboard.tsx`, otwierane w nowej karcie (`target="_blank" rel="noopener noreferrer"`), cel `/przewodnik-demo.html`:

1. **Modal powitalny** — subtelny link tekstowy pod dwoma istniejącymi przyciskami, przed stopką. Klasa: `block text-center text-sm font-semibold text-blue-100 hover:text-white underline underline-offset-4`. Tekst: `welcome.guide_link`.
2. **Nagłówek panelu** (desktop, `hidden lg:flex`) — link z ikoną `FileText` (już zaimportowana z lucide-react) pod powitaniem. Klasa: `inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700`. Tekst: `dashboard.guide_link`.

## i18n (nowe klucze, PL + EN)
- `welcome.guide_link`: PL „📖 Najpierw zobacz przewodnik po demo" · EN „See the demo guide first"
- `dashboard.guide_link`: PL „Przewodnik po demo" · EN „Demo guide"

## Poza zakresem (YAGNI)
- Śledzenie zdarzeń kliknięcia (atrybucja) — można dodać później.
- Trwały link w nagłówku mobilnym (nagłówek jest desktopowy `hidden lg:flex`); na mobile wystarcza link w modalu, działający wszędzie.

## Weryfikacja
- `npm run build` przechodzi (typecheck + vite).
- JSON poprawny, klucze obecne w PL i EN.
- Na deployu: link widoczny w modalu i nagłówku, otwiera przewodnik-demo w nowej karcie.

## Gałąź/deploy
Czysta gałąź `feat/link-przewodnik-demo` od `origin/main` → PR → merge → Vercel auto-deploy (buduje ze źródła, nie z `dist/`).
