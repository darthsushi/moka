import {
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  Tooltip,
  Typography
} from '@heroui/react';

import { formatCurrency, parseDayRange } from '@/helpers/utilities.helpers';
import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';
import { MIN_RENT_DAYS } from '@/settings/defaults.settings';

import { Animations } from '@/components/animations';
import { Icon } from '@/components/ui';

const obtainFaceData = ([{ images = [], day_range, period_price }]) => {
  const [firtImage] = images;
  const [minDays, maxDays] = parseDayRange(day_range);

  const lowestPrice = formatCurrency(period_price * (minDays / MIN_RENT_DAYS));
  const higherPrice = formatCurrency(period_price *  (maxDays / MIN_RENT_DAYS));

  return {
    image: firtImage,
    priceRange: [lowestPrice, higherPrice],
  }
};

function PlacementItemCard({
  placement,
  isMapOpen,
  isSelected,
  onExplorePlacement,
  onViewDetails
}) {
  const { language } = useLanguage();
  
  const SYSTEM_LANG = SYSTEM_LANGS[language];

  const primaryActionLabel = SYSTEM_LANG.BUTTONS.EXPLORE_SPACE;
  const secondaryActionLabel = SYSTEM_LANG.BUTTONS.SHOW_ON_MAP;

  const handleExplorePlacement = () => {
    onExplorePlacement?.(placement);
  };

  const handleViewDetails = () => {
    onViewDetails?.(placement);
  };

  const handlePrimaryAction = () => {
    handleViewDetails();
  };

  const handleSecondaryAction = () => {
    handleExplorePlacement();
  };
  
  const {
    id,
    city,
    code,
    country,
    state,
    type,
    faces
  } = placement || {};
  const { image, priceRange: [lowestPrice, higherPrice] } = obtainFaceData(faces);
  const placementLocation =  `${state}, ${country}`;
  const placementDiplayName = `${SYSTEM_LANG.PLACEMENT.TYPES[type]} ${SYSTEM_LANG.WORDS.IN} ${city}`;
  const ringCard = isSelected && isMapOpen && 'ring-2 ring-accent shadow-lg';

  return (
    <Animations.HoverCard variant="mark" data-placement-id={ id }>
      <Card className={ `col-span-1 rounded-4xl p-2 shadow-sm hover:shadow-lg ${ringCard}` }>
        <div className="w-full h-50 grid grid-cols-1 overflow-hidden rounded-4xl relative">
          <div
            className={ `bg-center bg-cover h-full col-span-1` }
            style={ { backgroundImage: `url(${image})` } }
          />
          <div className="w-full h-full absolute pointer-events-none flex flex-col justify-between px-2">
            <div className="w-full h-10 flex items-center justify-end">
              <Chip
                color="success"
                className="font-semibold pointer-events-auto"
              >
                <Icon name="qr-code" />
                { code }
              </Chip>
            </div>
            <div className="w-full h-10 flex items-center">
              <Chip
                className="max-w-[75%]"
                variant="secondary"
                color="warning"
              >
                <p className="truncate">
                  { placementLocation }
                </p>
              </Chip>
            </div>
          </div>
        </div>
        <Card.Content className="w-full flex flex-col">
          <Tooltip>
            <Tooltip.Trigger>
              <Typography
                type="body-sm"
                className="truncate leading-4.5">
                { placementDiplayName }
              </Typography>
            </Tooltip.Trigger>
            <Tooltip.Content>
              { placementDiplayName }
            </Tooltip.Content>
          </Tooltip>
          <Typography
            type="body-xs"
            color="muted"
            className="truncate flex items-center gap-1"
          >
            <Icon
              name="money-range"
              filled
            />
            { lowestPrice } - { higherPrice }
          </Typography>
        </Card.Content>
        <Card.Footer className="w-full grid grid-cols-5 gap-1">
          <Button
            fullWidth
            size="lg"
            variant="tertiary"
            className="col-span-4 truncate"
            onPress={handlePrimaryAction}
          >
            { primaryActionLabel }
          </Button>
          <Dropdown>
            <Button
              fullWidth
              size="lg"
              variant="tertiary"
              className="col-span-1 text-xl"
              aria-label="Placement options"
            >
              <Icon name="more-horiz" />
            </Button>

            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={ handleSecondaryAction }
              >
                <Dropdown.Item
                  id="secondary-action"
                  textValue={ secondaryActionLabel }
                >
                  <Icon name="map-search" />

                  <Label>
                    { secondaryActionLabel }
                  </Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </Card.Footer>
      </Card>
    </Animations.HoverCard>
  )
}

export default PlacementItemCard;
