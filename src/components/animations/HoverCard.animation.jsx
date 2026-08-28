import { getValueOrDefault } from '@/helpers/utilities.helpers';
import { motion } from 'motion/react';

function HoverCard({ children, className, tabAnimation = false, variant }) {
  const normalizedVariant = getValueOrDefault(variant, ['smoth', 'mark'], 'smoth');

  const whileHover = normalizedVariant === 'smoth' ? { y: -5 } : { y: -5, scale: 1.02 };
  const whileTap = tabAnimation && { scale: 0.98 };
  const transition = normalizedVariant === 'smoth' ?
    { type: "spring", stiffness: 300, damping: 20 } : { type: "spring", stiffness: 350, damping: 22 };

  return (
    <motion.div
      className={ className }
      whileHover={ whileHover }
      whileTap={ whileTap }
      transition={ transition }
    >
      { children }
    </motion.div>
  )
};

export default HoverCard;
