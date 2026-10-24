import { AnimatePresence, motion } from 'motion/react';

function VisibilityTransition({ children, visibility = true }) {

  return (
    <AnimatePresence>
      { visibility &&
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          { children }
        </motion.div>
      }
    </AnimatePresence>
  );
};

export default VisibilityTransition;