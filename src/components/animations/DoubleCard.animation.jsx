import { AnimatePresence, motion } from 'motion/react';

const INITIAL = { opacity: 0, y: 8, scale: 0.98 };
const ANIMATE = { opacity: 1, y: 0, scale: 1 };
const EXIT = { opacity: 0, y: -8, scale: 0.98 };

const TRANSITION = { duration: 0.2, ease: 'easeOut' };

function DoubleCard({
  children,
  className,
  animationId = 'double-card',
  ...rest
}) {
  return (
    <AnimatePresence
      mode="wait"
      initial={ false }
    >
      <motion.div
        key={ animationId }
        id={ `animation ${animationId}` }
        initial={ INITIAL }
        animate={ ANIMATE }
        exit={ EXIT }
        transition={ TRANSITION }
        className={ className }
        { ...rest }
      >
        { children }
      </motion.div>
    </AnimatePresence>
  );
}

export default DoubleCard;
