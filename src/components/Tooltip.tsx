import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Funkcja obliczająca pozycję dymka względem całego ekranu
  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2, // Środek elementu w poziomie
        y: rect.top // Góra elementu
      });
    }
  };

  useEffect(() => {
    if (show) {
      updateCoords();
      window.addEventListener('scroll', updateCoords);
    }
    return () => window.removeEventListener('scroll', updateCoords);
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              left: coords.x,
              top: coords.y,
              transform: 'translate(-50%, -120%)', // Przesunięcie nad element
              zIndex: 9999,
            }}
            className="w-64 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl shadow-2xl pointer-events-none border border-slate-700/50 text-center"
          >
            {text}
            {/* Strzałka */}
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '8px',
                borderStyle: 'solid',
                borderColor: '#0f172a transparent transparent transparent'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}