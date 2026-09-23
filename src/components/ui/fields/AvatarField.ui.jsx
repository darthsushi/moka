import { useCallback, useRef } from 'react';
import { useController } from 'react-hook-form';
import { Input } from '@heroui/react';

import { isNil, noop } from '@/helpers/ramda.helpers';
import { CircleAvatar } from '..';
import { Button } from '@heroui/react';
import { useState } from 'react';

function AvatarField({
  control,
  name = 'avatar_field',
  isDisabled = false,
  user = {},
  onChange = noop,
 /*  registerError = noop, */
}) {
  const fileInputRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => user);
  const {
    field,
    /* fieldState: { invalid, error }, */
  } = useController({
    name,
    control,
    defaultValue: user.avatar_url,
    rules: {
      disabled: isDisabled,
    },
  });

  const handleOnRemoveAvatar = () => {
    field.onChange(null);

    onChange(null);
    setCurrentUser({
      ...currentUser,
      avatar_url: null
    });
  };

  const handleOnChange = useCallback(({ target } = {}) => {
    const [currentAvatar] = target?.files || [];
    const preview = URL.createObjectURL(currentAvatar);
    
    field.onChange(currentAvatar);

    onChange(currentAvatar);
    setCurrentUser({
      ...currentUser,
      avatar_url: preview
    });
  }, [field, onChange, currentUser]);

  return (
    <section
      aria-label="images field"
      className="w-full gap-1 flex"
    >
      <CircleAvatar user={ currentUser } size="md" />
      <div className="grid grid-rows-2 gap-1 w-full p-1 h-fit">
        <Button size="lg" fullWidth onPress={ () => fileInputRef.current?.click() }>
          Subir foto
        </Button>
        <Button
          fullWidth
          variant="tertiary"
          isDisabled={ isNil(currentUser.avatar_url) }
          onPress={ handleOnRemoveAvatar }
        >
          Eliminar
        </Button>
      </div>
      <div
        className="hidden"
        aria-label="input file hidden"
      >
        <Input
          onChange={ handleOnChange }
          onBlur={ field.onBlur }
          name={ field.name }
          ref={ fileInputRef }
          id={ `images-field-${name}` }
          type="file"
          className="hidden"
          accept="image/*"
        />
      </div>
    </section>
  );
};

export default AvatarField;
