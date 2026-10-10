import { motion } from 'motion/react';

import { not } from '@/helpers/ramda.helpers';
import { getValueOrDefault } from '@/helpers/utilities.helpers';

const SMOTH_TYPE = 'smoth';
const MARK_TYPE = 'mark';

const SMOTH_TRANSITION = { type: "spring", stiffness: 300, damping: 20 };
const MARK_TRANSITION = { type: "spring", stiffness: 350, damping: 22 };

const SMOTH_VARIANT = { y: -5 };
const MARK_VARIANT = { y: -5, scale: 1.02 };

const WHILE_TAB = { scale: 0.98 };

function HoverCard({
  children,
  className,
  variant,
  tabAnimation = false,
  disableHoverAnimation = false,
  animationId = 'hover-card',
  ...rest
}) {
  const variantValue = getValueOrDefault(variant, SMOTH_TYPE, [SMOTH_TYPE, MARK_TYPE]);
  const whileHover = not(disableHoverAnimation) && (variantValue === SMOTH_TYPE ? SMOTH_VARIANT : MARK_VARIANT);
  const whileTap = tabAnimation && WHILE_TAB;
  const transition = variantValue === SMOTH_TYPE ? SMOTH_TRANSITION : MARK_TRANSITION;

  return (
    <motion.div
      id={ `animation ${animationId}` }
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
