import { Avatar } from '@heroui/react';

import { not } from '@/helpers/ramda.helpers';
import { getValueOrDefault } from '@/helpers/utilities.helpers';

const SHAPE_SIZES = {
  xs: 'w-10 h-10 shadow-xs rounded-3xl',
  sm: 'w-12 h-12 shadow-sm rounded-4xl',
  md: 'w-25 h-25 shadow-sm rounded-[30px]',
  lg: 'w-37 h-37 shadow-sm rounded-[40px]'
};

const FALLBACK_SIZE = {
  xs: 'text-lg select-none',
  sm: 'text-xl select-none',
  md: 'text-5xl select-none',
  lg: 'text-7xl select-none'
};


const getInitials = (name) => {
  if (typeof name !== 'string') return '';

  const words = name.trim().split(/\s+/).filter(Boolean);

  if (not(words.length)) return '';

  const firstInitial = words[0][0];

  if (words.length === 1) {
    return firstInitial.toUpperCase();
  }

  const lastInitial = words.at(-1)[0];

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function CircleAvatar({ user = {}, size }) {
  const { name, avatar_url } = user;
  const actualSize = getValueOrDefault(size, ['xs', 'sm', 'md', 'lg'], 'sm');
  const initials = getInitials(name);

  return (
    <Avatar color="accent" className={ `flex-none m-0.5 ${SHAPE_SIZES[actualSize]}` }>
      <Avatar.Image
        alt={ name }
        src={ avatar_url }
      />
      <Avatar.Fallback>
        <span className={ FALLBACK_SIZE[actualSize] }>
          { initials }
        </span>
      </Avatar.Fallback>
    </Avatar>
  );
};

export default CircleAvatar;
