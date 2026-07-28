/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { Button, Card, Chip, Dropdown, Label, Skeleton } from '@heroui/react';

import { SYSTEM as SYSTEM_LANG } from '../../settings/langs.settings';
import { isEmpty } from '../../helpers/ramda.helpers';
import { classNameParser } from '../../helpers/utilities.helpers';

import { usePublicPlacements } from '../../hooks/usePublicPlacements';
import { useLanguage } from '../../hooks/useLanguage';

import Icon from '../icons';

const getLowestPeriodPrice = (facesArray) => {
  if (isEmpty(facesArray)) return 0;
  
  return Math.min(...facesArray.map(face => face.period_price));
};

const getHighestAvailablePeriods = (facesArray) => {
  if (isEmpty(facesArray)) return 0;
  
  return Math.max(...facesArray.map(face => face.available_periods));
};

function Home() {
  const { refetch, placements, isLoading, error } = usePublicPlacements();
  const { language } = useLanguage();

  const WORDS_LANG = SYSTEM_LANG[language].WORDS;
  const BUTTONS_LANG = SYSTEM_LANG[language].BUTTONS;
  const PLACEMENT_TYPES_LANG = SYSTEM_LANG[language].PLACEMENT.TYPES;

  /* const placementTypeNames = PLACEMENT_TYPES[language];
  const WORDS = SIMPLE_WORDS[language];
  const EXPLOR_BUTTON_LABEL = BUTTONS[language].EXPLORE_SPACE; */

  useEffect(() => {
    refetch();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-10 py-2 grid grid-cols-4 gap-2 px-3">
        <div className="shadow-panel space-y-3 rounded-3xl bg-transparent p-4">
          <Skeleton animationType="shimmer" className="h-45 rounded-3xl" />
          <Skeleton animationType="shimmer" className="h-3 w-3/5 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-3 w-4/5 rounded-lg" />
        </div>
        <div className="shadow-panel space-y-3 rounded-3xl bg-transparent p-4">
          <Skeleton animationType="shimmer" className="h-45 rounded-3xl" />
          <Skeleton animationType="shimmer" className="h-3 w-3/5 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-3 w-4/5 rounded-lg" />
        </div>
        <div className="shadow-panel space-y-3 rounded-3xl bg-transparent p-4">
          <Skeleton animationType="shimmer" className="h-45 rounded-3xl" />
          <Skeleton animationType="shimmer" className="h-3 w-3/5 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-3 w-4/5 rounded-lg" />
        </div>
        <div className="shadow-panel space-y-3 rounded-3xl bg-transparent p-4">
          <Skeleton animationType="shimmer" className="h-45 rounded-3xl" />
          <Skeleton animationType="shimmer" className="h-3 w-3/5 rounded-lg" />
          <Skeleton animationType="shimmer" className="h-3 w-4/5 rounded-lg" />
        </div>
      </div>
    );
  }
  if (error) return <div>Ocurrió un error: {error}</div>;
  if (placements.length === 0) return <div>No hay espacios disponibles por ahora.</div>;

  return (
    <div className="w-full min-h-10 py-2 grid grid-cols-4 gap-2 px-3">
      {
        placements.map((placement) => {
          const {
            code,
            owner,

          } = placement;
          const lowestPeriodPrice = getLowestPeriodPrice(placement_faces);
          const highestAvailablePeriods = getHighestAvailablePeriods(placement_faces);

          const IMAGES_CONTAINER_CLASS = classNameParser([
            placement_faces.length === 4 ? 'grid-cols-2' : `grid-cols-${placement_faces.length}`,
            'grid gap-0.5',
            'w-full h-full relative'
          ]);
          console.log(placement);

          return(<>ok</>)

          return (
            <Card
              
              id={ id }
              key={ id }
              className="p-1"
            >
              <div className="relative h-45 w-full shrink-0 overflow-hidden rounded-3xl">
                <div className="w-full h-full absolute z-2 flex flex-col justify-between">
                  <div className="w-full h-13 px-2 flex justify-between items-center">
                    
                    <Dropdown>
                      <Button
                        isIconOnly
                        className="text-xl"
                        size="sm"
                        variant="secondary"
                      >
                        <Icon name="more-horiz" />
                      </Button>
                      <Dropdown.Popover>
                        <Dropdown.Menu onAction={(key) => console.log(`Selected: ${key}`)}>
                          <Dropdown.Item
                            id="OPTION_EXPLORE_SPACE"
                            textValue={ BUTTONS_LANG.EXPLORE_SPACE }
                          >
                            <Label>
                              { BUTTONS_LANG.EXPLORE_SPACE }
                            </Label>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </div>
                  <div className="w-full h-10 px-2 flex justify-between items-center">
                    <Chip color="default" variant="secondary">
                      { PLACEMENT_TYPES_LANG[placementType] }
                    </Chip>
                  </div>
                </div>
                <div className={ IMAGES_CONTAINER_CLASS }>
                  {
                    placement_faces.map((actualFace) => {
                      return (
                        <div key={ actualFace.id } className="relative col-span-1 overflow-hidden rounded-3xl">
                          <img
                            alt={ actualFace.id }
                            className="pointer-events-none absolute inset-0 w-full h-full scale-125 object-cover select-none"
                            loading="lazy"
                            src={ actualFace.images[0] }
                          />
                        </div>
                      );
                    })
                  }
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-1">
                <Card.Header className="gap-1 max-h-18 overflow-hidden">
                  <Card.Title className="truncate">
                    { PLACEMENT_TYPES_LANG[placementType] } { WORDS_LANG.IN } Merida, Yucatan
                  </Card.Title>
                </Card.Header>
                <Card.Content className="mt-auto flex w-full gap-1 flex-row items-center justify-between">
                  <Chip color="success" variant="soft">
                    { WORDS_LANG.FROM } ${ lowestPeriodPrice }
                  </Chip>
                  <Chip color="accent" variant="soft">
                    <Icon name="calendar-clock" filled />
                    { WORDS_LANG.UP_TO } { highestAvailablePeriods * 15 } { WORDS_LANG.DAYS }
                  </Chip>
                </Card.Content>
                <Card.Footer className="mt-auto flex w-full gap-1 flex-row items-center justify-between">
                  <Button size="lg" variant="tertiary" fullWidth>
                    { BUTTONS_LANG.EXPLORE_SPACE }
                  </Button>
                </Card.Footer>
              </div>
            </Card>
          )
        })
      }
    </div>
  )
};

export default Home;
