import { useCallback, useEffect, useRef, useState } from 'react';
import { useController } from 'react-hook-form';
import { Button, Input } from '@heroui/react';

import { isNil, noop } from '@/helpers/ramda.helpers';

import CircleAvatar from '../profile/CircleAvatar.ui';

function AvatarField({
  control,
  name = 'avatar_field',
  isDisabled = false,
  user = {},
  onChange = noop,
 /*  registerError = noop, */
}) {
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);
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

  useEffect(() => () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
  }, []);

  const handleOnRemoveAvatar = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    field.onChange(null);

    onChange(null);
    setCurrentUser((actualUser) => ({
      ...actualUser,
      avatar_url: null
    }));
  };

  const handleOnChange = useCallback(({ target } = {}) => {
    const [currentAvatar] = target?.files || [];

    if (!currentAvatar) {
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const preview = URL.createObjectURL(currentAvatar);
    previewUrlRef.current = preview;
    
    field.onChange(currentAvatar);

    onChange(currentAvatar);
    setCurrentUser((actualUser) => ({
      ...actualUser,
      avatar_url: preview
    }));
  }, [field, onChange]);

  const handleUploadPress = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <section
      aria-label="images field"
      className="w-full gap-1 flex"
    >
      <CircleAvatar user={ currentUser } size="md" />
      <div className="grid grid-rows-2 gap-1 w-full p-1 h-fit">
        <Button size="lg" fullWidth onPress={ handleUploadPress }>
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
          accept="image/jpeg,image/png,image/webp"
        />
      </div>
    </section>
  );
};

export default AvatarField;
