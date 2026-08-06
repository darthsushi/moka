import './Icon.ui.css';
import { isNil } from '@/helpers/ramda.helpers';

import AddLocation from './svg-icons/AddLocation.svg.jsx';
import ArrowDropDown from './svg-icons/ArrowDropDown.svg.jsx';
import ArrowDropUp from './svg-icons/ArrowDropUp.svg.jsx';
import AttachMoney from './svg-icons/AttachMoney.svg.jsx';
import CalendarClock from './svg-icons/CalendarClock.svg.jsx';
import Close from './svg-icons/Close.svg.jsx';
import DoubleArrowRightIcon from './svg-icons/DoubleArrowRight.svg.jsx';
import DoubleArrowLeftIcon from './svg-icons/DoubleArrowLeft.svg.jsx';
import Edit from './svg-icons/Edit.svg.jsx';
import FindImage from './svg-icons/FindImage.svg.jsx';
import HomeIcon from './svg-icons/Home.svg.jsx';
import Image from './svg-icons/Image.svg.jsx';
import Inventory from './svg-icons/inventory.svg';
import LanguageIcon from './svg-icons/Language.svg.jsx';
import MagnifyFullScreen from './svg-icons/MagnifyFullScreen.svg.jsx';
import MoreHoriz from './svg-icons/MoreHoriz.svg.jsx';
import Remove from './svg-icons/Remove.svg.jsx';
import UploadImage from './svg-icons/UploadImage.svg.jsx';
import DarkMode from './svg-icons/DarkMode.svg.jsx';
import LightMode from './svg-icons/LightMode.svg.jsx';
import Preview from './svg-icons/Preview.svg.jsx';
import Visibility from './svg-icons/Visibility.svg.jsx';
import Filter from './svg-icons/Filter.svg.jsx';
import QrCode from './svg-icons/QrCode.svg.jsx';
import Favorite from './svg-icons/Favorite.svg.jsx';
import ThumbnailBar from './svg-icons/ThumbnailBar.svg';
import Search from './svg-icons/search.svg';

function Icon({ name, filled }) {
  const SGVS = {
    'add-location': AddLocation,
    'arrow-drop-down': ArrowDropDown,
    'arrow-drop-up': ArrowDropUp,
    'attach-money': AttachMoney,
    'close': Close,
    'calendar-clock': CalendarClock,
    'dark-mode': DarkMode,
    'double-arrow-right': DoubleArrowRightIcon,
    'double-arrow-left': DoubleArrowLeftIcon,
    'edit': Edit,
    'favorite': Favorite,
    'filter': Filter,
    'find-image': FindImage,
    'home': HomeIcon,
    'inventory': Inventory,
    'image': Image,
    'language': LanguageIcon,
    'light-mode': LightMode,
    'magnify-full-screen': MagnifyFullScreen,
    'more-horiz': MoreHoriz,
    'preview': Preview,
    'qr-code': QrCode,
    'remove': Remove,
    'search': Search,
    'thumbnail-bar': ThumbnailBar,
    'upload-image': UploadImage,
    'visibility': Visibility,
  };

  const CurrentIcon =  SGVS[name];

  if (isNil(CurrentIcon)) return null;

  return <CurrentIcon filled={ filled } />;
}

export default Icon;
