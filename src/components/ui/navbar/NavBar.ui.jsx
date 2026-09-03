import { Card } from '@heroui/react';

function NavBar({ children, className, stickyTop }) {
  const sticky = stickyTop >= 0 ? `sticky top-${stickyTop} z-10` : '';

  return (
    <section data-table-actions className={ `w-full h-15 px-2 ${sticky}` }>
      <Card
        variant="secondary"
        className={ `w-full h-full py-2 px-3 rounded-4xl ${className}` }
      >
        { children }
      </Card>
    </section>
  )
};

export default NavBar;
