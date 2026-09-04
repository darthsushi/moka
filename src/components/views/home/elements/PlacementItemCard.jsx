import {
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  Tooltip,
  Typography
} from '@heroui/react';

import { SYSTEM } from '@/settings/langs.settings';
import { useLanguage } from '@/hooks/contexts';

import { Animations } from '@/components/animations';
import { Icon } from '@/components/ui';

function ItemThumbnail({ faces = [], placementCode, location }) {
  const imagesList = faces[0]?.images || [];
  const [firstImage] = imagesList;

  return (
    <div className="w-full h-50 grid grid-cols-1 overflow-hidden rounded-4xl relative">
        <div
          className={ `bg-center bg-cover h-full col-span-1` }
          style={ { backgroundImage: `url(${firstImage})` } }
        />
      <div className="w-full h-full absolute pointer-events-none flex flex-col justify-between px-2">
        <div className="w-full h-10 flex items-center justify-end">
          <Chip color="success" className="font-semibold pointer-events-auto">
            <Icon name="qr-code" />
            { placementCode }
          </Chip>
        </div>
        <div className="w-full h-10 flex items-center">
          <Chip className="max-w-[75%]">
            <p className="truncate">{ location }</p>
          </Chip>
        </div>
      </div>
    </div>
  );
}

function PlacementItemCard({
  placement,
  isMapOpen,
  isSelected,
  onExplorePlacement,
  onViewDetails
}) {
  const { language } = useLanguage();
  
  const SYSTEM_LANG = SYSTEM[language];

  const primaryActionLabel = isMapOpen
    ? SYSTEM_LANG.BUTTONS.EXPLORE_SPACE
    : SYSTEM_LANG.BUTTONS.VIEW_DETAILS;

  const secondaryActionLabel = isMapOpen
    ? SYSTEM_LANG.BUTTONS.VIEW_DETAILS
    : SYSTEM_LANG.BUTTONS.EXPLORE_SPACE;

  const handleExplorePlacement = () => {
    onExplorePlacement?.(placement);
  };

  const handleViewDetails = () => {
    onViewDetails?.(placement);
  };

  const handlePrimaryAction = () => {
    if (isMapOpen) {
      handleExplorePlacement();

      return;
    }

    handleViewDetails();
  };

  const handleSecondaryAction = () => {
    if (isMapOpen) {
      handleViewDetails();

      return;
    }

    handleExplorePlacement();
  };
  
  const { city, country, municipality, state } = placement.location;
  const placementLocation = municipality || city || state || country;
  const placementDiplayName = `${SYSTEM_LANG.PLACEMENT.TYPES[placement.type]} ${SYSTEM_LANG.WORDS.IN} ${placementLocation}`;

  return (
    <Animations.HoverCard variant="mark" data-placement-id={ placement.id }>
      <Card className={ `col-span-1 rounded-4xl p-2 shadow-sm hover:shadow-lg ${ isSelected ? 'ring-2 ring-primary shadow-lg' : '' }` }>
        <ItemThumbnail
          faces={ placement.faces || [] }
          placementCode={ placement.code }
          location={ state || country }
        />
        <Card.Content>
          <Tooltip>
            <Tooltip.Trigger>
              <Typography type="body-sm" className="truncate leading-4.5">
                { placementDiplayName }
              </Typography>
            </Tooltip.Trigger>
            <Tooltip.Content>
              { placementDiplayName }
            </Tooltip.Content>
          </Tooltip>
        </Card.Content>
        <Card.Footer className="w-full grid grid-cols-6 gap-1">
          <Button
            fullWidth
            size="lg"
            variant="tertiary"
            className="col-span-4 truncate"
            onPress={handlePrimaryAction}
          >
            {primaryActionLabel}
          </Button>
          <Tooltip>
            <Button
              fullWidth
              size="lg"
              variant="danger-soft"
              className="col-span-1"
            >
              <Icon name="favorite" />
            </Button>
            <Tooltip.Content>
              <p>
                { SYSTEM_LANG.TOOLTIPS.MARK_FAVORITE }
              </p>
            </Tooltip.Content>
          </Tooltip>
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

            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu
                onAction={handleSecondaryAction}
              >
                <Dropdown.Item
                  id="secondary-action"
                  textValue={secondaryActionLabel}
                >
                  <Icon
                    name={
                      isMapOpen
                        ? 'map-search'
                        : 'visibility'
                    }
                  />

                  <Label>
                    {secondaryActionLabel}
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
