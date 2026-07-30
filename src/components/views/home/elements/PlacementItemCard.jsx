import { useState } from 'react';
import { Button, Card, Chip, Description, Tooltip, Typography } from '@heroui/react';

import { SYSTEM } from '@/settings/langs.settings';
import { useLanguage } from '@/hooks/useLanguage';

import { Dialog, Icon } from '@/components/ui';

const getSize = (position, facesLength) => {
  const isEven = facesLength % 2 === 0;

  return isEven
    ? 'col-span-2'
    : position === facesLength - 1 ? 'col-span-4' : 'col-span-2';
}

function ImageCollage({ faces, code, systemLang }) {
  
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
            { code }
          </Chip>
        </div>
        <div className="w-full h-10 flex items-center">
          <Chip>
            {faces.length } { systemLang.TEXTS.AVAILABLE_FACES }
          </Chip>
        </div>
      </div>
    </div>
  );
}

function PlacementItemCard({ placement }) {
  const [isModalOpen, setIsModalOpen] = useState(() => false);
  const { language } = useLanguage();
  const { neighbourhood, road, municipality, city } = placement.location;

  const SYSTEM_LANG = SYSTEM[language];

  const locationDisplay = `${SYSTEM_LANG.PLACEMENT.TYPES[placement.type]} ${SYSTEM_LANG.WORDS.IN} ${city || neighbourhood || road || municipality  }`

  return (
    <Card className="col-span-1 rounded-4xl p-2">
      <ImageCollage
        faces={ placement.faces || [] }
        code={ placement.code }
        systemLang={ SYSTEM_LANG }
      />
      <Card.Content>
        <Typography type="body-sm" className="leading-4.5">
          { locationDisplay }
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
