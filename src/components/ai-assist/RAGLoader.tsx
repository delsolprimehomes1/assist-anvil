import { motion } from 'framer-motion';
import { Puzzle } from 'lucide-react';

export const RAGLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex gap-3 mb-4"
    >
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[hsl(var(--rag-gold))] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Puzzle className="w-5 h-5 text-[hsl(var(--rag-gold))]" />
        </motion.div>
      </div>

      {/* Loading Message */}
      <div className="flex flex-col max-w-[80%]">
        <div className="rounded-2xl px-4 py-3 bg-white border-2 border-[hsl(var(--rag-gold))]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[hsl(var(--rag-navy))]">
              🧩 Searching the BatterBox Database for your answer
            </span>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-[hsl(var(--rag-navy))]"
            >
              ...
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
