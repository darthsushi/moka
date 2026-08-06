import { useState } from 'react';
import { Button, Card, Chip, Description, Tooltip, Typography } from '@heroui/react';

import { SYSTEM } from '@/settings/langs.settings';
import { useLanguage } from '@/hooks/contexts';

import { Dialog, Icon } from '@/components/ui';
import { isNotNil } from 'ramda';

const getSize = (position, facesLength) => {
  const isEven = facesLength % 2 === 0;

  return isEven
    ? 'col-span-2'
    : position === facesLength - 1 ? 'col-span-4' : 'col-span-2';
}

function ImageCollage({ faces, placementCode, placementLocation }) {
  
  return (
    <div className="w-full h-40 grid grid-cols-4 gap-0.5 overflow-hidden rounded-4xl relative">
      {   
        faces.map((actualFace, index) => {

          return (
            <div
              key={ index }
              className={ `bg-center bg-cover h-full ${getSize(index, faces.length)}` }
              style={ { backgroundImage: `url(${actualFace.images[0]})` } }
            />
          );
        })
      }
      <div className="w-full h-full absolute pointer-events-none flex flex-col justify-between px-1">
        <div className="w-full h-10 flex items-center justify-end">
          <Chip color="success" className="font-semibold pointer-events-auto">
            <Icon name="qr-code" />
            { placementCode }
          </Chip>
        </div>
        <div className="w-full h-10 flex items-center">
          <Chip className="max-w-[75%]">
            <p className="truncate">{ placementLocation }</p>
          </Chip>
        </div>
      </div>
    </div>
  );
}

function PlacementItemCard({ placement }) {
  const [isModalOpen, setIsModalOpen] = useState(() => false);
  const { language } = useLanguage();
  const { display_name, city, municipality, state } = placement.location;

  const SYSTEM_LANG = SYSTEM[language];

  const placementDiplayName = `${SYSTEM_LANG.PLACEMENT.TYPES[placement.type]} ${SYSTEM_LANG.WORDS.IN} ${display_name}`
  const placementLocation =  `${municipality || city}${ isNotNil(state) && `, ${state}` }`;

  return (
    <Card className="col-span-1 rounded-4xl p-2">
      <ImageCollage
        faces={ placement.faces || [] }
        placementCode={ placement.code }
        placementLocation={ placementLocation }
      />
      <Card.Content>
        <Typography type="body-sm" className="leading-4.5">
          { placementDiplayName }
        </Typography>
        <Description className="w-full truncate">
          { placement.description }
        </Description>
      </Card.Content>
      <Card.Footer className="w-full grid grid-cols-6 gap-1">
        <Button
          fullWidth
          size="lg"
          variant="tertiary"
          className="col-span-4 truncate"
          onPress={ () => setIsModalOpen(true) }
        >
          { SYSTEM_LANG.BUTTONS.EXPLORE_SPACE }
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
        <Button
          fullWidth
          size="lg"
          variant="tertiary"
          className="col-span-1 text-xl"
        >
          <Icon name="more-horiz" />
        </Button>
      </Card.Footer>
      <Dialog
        isModalOpen={ isModalOpen }
        setIsModalOpen={ setIsModalOpen }
        size="cover"
      >
        <Typography type="h5">
          { placement.code }
        </Typography>
      </Dialog>
    </Card>
  )
}

export default PlacementItemCard;
