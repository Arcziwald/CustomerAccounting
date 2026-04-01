# 📠 CustomerAccounting - AI Accountant Agent

> Inteligentny asystent, który automatycznie analizuje faktury i suplementy w Twoim biurze rachunkowym. Zasilany przez n8n i Gemini.

![Główny widok aplikacji](https://client.accounting.artwebcraft.com/dashboard_screenshot.png.png)

## ✅ Co potrafi ta aplikacja?

- [x] **Panel dla klienta:** Intuicyjny interfejs, do którego klient po prostu przeciąga swoje dokumenty.
- [x] **Automatyczna analiza AI:** System w czasie rzeczywistym rozpoznaje, czy wgrany plik to **faktura kosztowa** (wtedy analizuje NIP, kwoty) czy **suplement**.
- [x] **Integracja z n8n:** Cała logika biznesowa siedzi w n8n na Hostingerze, dzięki czemu frontend (na Vercel) jest szybki i bezpieczny.
- [ ] **Podgląd dokumentu (w toku):** Wkrótce dodamy możliwość podglądu wgranego pliku bezpośrednio na stronie.

## 🚀 Zobacz aplikację na żywo

👉 **[client.accounting.artwebcraft.com](https://client.accounting.artwebcraft.com)**

---

## 🛠️ Architektura systemu

System działa w modelu "Low-Code Frontend, Zero-Code Backend":

1.  **Frontend (To, co widzisz):** React + Vite na **Vercel**. Szybki, responsywny interfejs.
2.  **Backend (To, co myśli):** n8n na **Hostingerze**. Cała magia dzieje się tutaj (Webhooki, Gemini API).
3.  **AI (To, co analizuje):** **Google Gemini AI Studio** (za pośrednictwem n8n) rozpoznaje typy dokumentów.

### Jak to przetestować?

1.  W n8n na Hostingerze włącz webhook testowy (`Listen for test event`).
2.  Na stronie aplikacji wgraj dowolną fakturę.
3.  Zobacz, jak n8n na Hostingerze automatycznie odbiera dane.

---

## 📝 O tym projekcie

Projekt powstał przy użyciu **Google AI Studio** i jest dowodem na to, że można zbudować pełnoprawny, inteligentny system księgowy w kilka dni, łącząc low-code z zaawansowanym AI.

*Copyright © 2026 ArtWebCraft*
