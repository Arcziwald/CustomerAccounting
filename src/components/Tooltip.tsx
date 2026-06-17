import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Stały odstęp dymka od ikony, która go wywołuje — żeby nie zasłaniał klikalnego elementu
const GAP = 18;

export default function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Pozycja dymka względem całego ekranu (środek poziomy + góra elementu)
  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    }
  };

  useEffect(() => {
    if (show) {
      updateCoords();
      // capture=true, żeby łapać też scroll wewnętrznych kontenerów
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [show]);

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          // WAŻNE: animujemy TYLKO opacity. Gdyby framer-motion animował scale/x/y,
          // nadpisałby `transform` ze stylu i dymek wylądowałby na ikonie.
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              left: coords.x,
              top: coords.y - GAP,                 // odsuwamy dymek w górę od ikony
              transform: 'translate(-50%, -100%)', // wyśrodkowanie + nad elementem
              zIndex: 9999,
              pointerEvents: 'none',
            }}
            className="w-64 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl shadow-2xl border border-slate-700/50 text-center"
          >
            {text}
            {/* Strzałka skierowana w dół, ku ikonie */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '8px',
                borderStyle: 'solid',
                borderColor: '#0f172a transparent transparent transparent',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
