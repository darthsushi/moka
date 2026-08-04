import { useNavigate } from 'react-router-dom';

function Logo({ small }) {
  const LOGO = small ? './assets/moka/logo.png' : './assets/moka/letters.svg';
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-50 h-18 flex justify-center py-2">
      <img
        onClick={ () => navigate('/') }
        src={ LOGO }
        className="h-full cursor-pointer select-none drag-"
      />
    </div>
  );
}

export default Logo;
