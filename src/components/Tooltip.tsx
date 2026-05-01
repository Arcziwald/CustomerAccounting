import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip = ({ text, children }: TooltipProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center" 
         onMouseEnter={() => setShow(true)} 
         onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[100] bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl pointer-events-none"
          >
            <div className="relative">
              {text}
              {/* Strzałka */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};