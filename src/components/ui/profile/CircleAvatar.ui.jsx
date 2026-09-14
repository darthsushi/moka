import { Avatar } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';
import { getValueOrDefault } from '@/helpers/utilities.helpers';

const SHAPE_SIZES = {
  sm: 'w-12 h-12 rounded-4xl',
  md: 'w-25 h-25 rounded-[30px]',
  lg: 'w-37 h-37 rounded-[40px]'
};

/* const obtainInitials = (name = '') => {

}; */

function CircleAvatar({ user = {}, size }) {
  const { name, avatar_url } = user;
  const actualSize = getValueOrDefault(size, ['sm', 'md', 'lg'], 'sm');

  /* const shapeSize = actualSize === 'sm' ? '' */

  return (
    <Avatar className={ SHAPE_SIZES[actualSize] }>
      { isNotNil(avatar_url) &&
        <Avatar.Image
          alt={ name }
          src={ avatar_url }
        />
      }
      <Avatar.Fallback>LG</Avatar.Fallback>
    </Avatar>
  );
};

export default CircleAvatar;
