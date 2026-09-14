import { motion } from 'motion/react';

import { not } from '@/helpers/ramda.helpers';
import { getValueOrDefault } from '@/helpers/utilities.helpers';

function HoverCard({
  children,
  className,
  variant,
  tabAnimation = false,
  disableHoverAnimation = false,
  ...rest
}) {
  const variantValue = getValueOrDefault(variant, 'smoth', ['smoth', 'mark']);
  const whileHover = not(disableHoverAnimation) && (variantValue === 'smoth' ? { y: -5 } : { y: -5, scale: 1.02 });
  const whileTap = tabAnimation && { scale: 0.98 };
  const transition = variantValue === 'smoth' ?
    { type: "spring", stiffness: 300, damping: 20 } : { type: "spring", stiffness: 350, damping: 22 };

  return (
    <motion.div
      className={ className }
      whileHover={ whileHover }
      whileTap={ whileTap }
      transition={ transition }
      { ...rest }
    >
      { children }
    </motion.div>
  )
};

export default HoverCard;
