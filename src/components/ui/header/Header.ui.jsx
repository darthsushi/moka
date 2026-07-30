import LanguageButton from './elements/LanguageButton';
import AvatarAccount from './elements/AvatarAccount';
import OwnerButton from './elements/OwnerButton';

function Header() {
  
  return (
    <header className="w-full h-20 sticky top-0 p-2 z-50 bg-background">
      <div className="w-full h-full max-w-275 m-auto flex justify-end">
        <div className="h-full flex items-center gap-1">
          <LanguageButton />
          <OwnerButton />
          <AvatarAccount />
        </div>
      </div>
    </header>
  );
};

export default Header;
