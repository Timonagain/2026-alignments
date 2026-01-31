
import React, { useState, useEffect } from 'react';
import { EVENT_DATE } from '../constants';

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = EVENT_DATE.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return <div className="text-amber-500 font-cinzel text-2xl">The Birth is Manifest</div>;

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-3xl md:text-4xl font-cinzel text-amber-400">{value}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
            {unit === 'd' ? 'Days' : unit === 'h' ? 'Hours' : unit === 'm' ? 'Minutes' : 'Seconds'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Countdown;
