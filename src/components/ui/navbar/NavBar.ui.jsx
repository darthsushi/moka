import { Card } from '@heroui/react';

function NavBar({
  children,
  className = '',
  contentClassName = '',
}) {

  return (
    <section data-table-actions className={ `w-full h-15 px-2 ${className}` }>
      <Card
        variant="tertiary"
        className={ `w-full h-full py-2 px-3 ${contentClassName}` }
      >
        { children }
      </Card>
    </section>
  )
};

export default NavBar;
