import { Modal } from '@heroui/react';
import { isNotNil, noop } from '@/helpers/ramda.helpers';

import Icon from '../icons/Icon.ui';

function Dialog({
  children = null,
  fillIcon = true,
  iconName = null,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  isLoading = false,
  isModalOpen = false,
  placement = 'bottom',
  setIsModalOpen = noop,
  showDefaultCloseButton = true,
  size = 'lg',
  title = '',
  variant = 'blur',
}) {

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
          className={ `transition-all rounded-4xl ${ ['sm', 'lg'].includes(size) && 'max-h-150' }` }
        >
          
          { showDefaultCloseButton && 
            <Modal.CloseTrigger isPending={ isLoading } isDisabled={ isLoading }>
              <Icon name="close" />
            </Modal.CloseTrigger>
          }
          
          <Modal.Header>
            { isNotNil(iconName) &&
              <Modal.Icon className="bg-default text-foreground text-2xl">
                <Icon name={ iconName } filled={ fillIcon } />
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
