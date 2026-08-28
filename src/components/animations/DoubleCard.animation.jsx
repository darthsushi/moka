import { AnimatePresence, motion } from 'motion/react';

function DoubleCard({ children, className, animationId }) {
  return (
    <AnimatePresence
      mode="wait"
      initial={ false }
    >
      <motion.div
        key={ animationId }
        id={ `animation ${animationId}` }
        initial={{
          opacity: 0,
          y: 8,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -8,
          scale: 0.98,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
        className={ className }
      >
        { children }
      </motion.div>
    </AnimatePresence>
  );
}

export default DoubleCard;
