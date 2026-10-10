import { Modal } from '@heroui/react';
import { isNotNil, noop } from '@/helpers/ramda.helpers';

import Icon from '../icons/Icon.ui';

function Dialog({
  children = null,
  icon = {},
  dismissOptions = {},
  isLoading = false,
  isModalOpen = false,
  setIsModalOpen = noop,
  placement = 'bottom',
  size = 'lg',
  title = '',
  variant = 'blur',
}) {
  const { filled: iconFilled, name: iconName } = icon;
  const {
    enabled: isDismissable,
    disableKeyboard: isKeyboardDismissDisabled,
    showCloseButton,
  } = dismissOptions;

  return (
    <Modal.Backdrop
      isOpen={ isModalOpen }
      variant={ variant }
      isDismissable={ isLoading ? false : isDismissable }
      isKeyboardDismissDisabled={ isLoading ? true : isKeyboardDismissDisabled }
      onOpenChange={ setIsModalOpen }
    >
      <Modal.Container
        size={ size }
        placement={ placement }
        scroll="inside"
        className="min-h-auto transition-all"
      >
        <Modal.Dialog
          className={ `transition-all border-2 ${ ['sm', 'lg'].includes(size) && 'max-h-150' }` }
        >
          
          { (showCloseButton && isDismissable) && 
            <Modal.CloseTrigger
              isPending={ isLoading }
              isDisabled={ isLoading }
            >
              <Icon name="close" />
            </Modal.CloseTrigger>
          }
          
          <Modal.Header>
            { isNotNil(iconName) &&
              <Modal.Icon className="bg-default text-foreground text-2xl">
                <Icon
                  filled={ iconFilled || true }
                  name={ iconName }
                />
              </Modal.Icon>
            }
            <Modal.Heading className="font-bold text-xl capitalize">
              { title }
            </Modal.Heading>
          </Modal.Header>
          
          <Modal.Body className="p-0 transition-all">
            { children }
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export default Dialog;
