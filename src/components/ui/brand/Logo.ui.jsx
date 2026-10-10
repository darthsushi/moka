import { useNavigate } from 'react-router-dom';

function Logo({ small }) {
  const origin = window.location.origin;
  const LOGO = small ? `${origin}/assets/moka/logo.png` : `${origin}/assets/moka/letters.svg`;
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
