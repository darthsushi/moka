import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button, Chip, Typography } from '@heroui/react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { formatCurrency } from '@/i18n/formatters';
import { not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';
import { MIN_RENT_DAYS } from '@/settings/defaults.settings';
import { placementsService } from '@/services/placements.service';
import { FlatCard, Icon, GoogleMapsView, Header } from '@/components/ui';

const facePrice = (face, language) => {
  const range = face?.day_range;
  const price = Number(face?.period_price);

  if (!range || face?.period_price == null || !Number.isFinite(price)) return null;

  return {
    formatted: formatCurrency(price * range[0] / MIN_RENT_DAYS, 'MXN', language),
    range
  };
};

function PlacementDetails({ isDialog = false }) {
  const { t, i18n } = useTranslation();
  const { code, id, shareToken } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [retry, setRetry] = useState(0);
  const requestKey = [code, id, shareToken, authLoading, user?.id, retry].join('|');
  const [request, setRequest] = useState({ key: null, placement: null, error: null });
  const [selectedFaceId, setSelectedFaceId] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    let active = true;

    // Repeat the request when Auth finishes restoring a session, so a direct
    // visit to an owner's private placement also works after a page reload.
    placementsService.getPlacementDetails({ code, id, shareToken })
      .then((data) => {
        if (active) setRequest({ key: requestKey, placement: data, error: null });
      })
      .catch((requestError) => {
        if (active) setRequest({ key: requestKey, placement: null, error: requestError });
      });

    return () => { active = false; };
  }, [code, id, shareToken, authLoading, user?.id, retry, requestKey]);

  if (request.key !== requestKey) return <p role="status" className="p-8 text-muted">{ t('common:loading') }</p>;

  if (request.error) return (
    <div role="alert" className="flex flex-col items-start gap-3 p-8">
      <p>{ t('placements:details.error') }</p>
      <Button variant="secondary" onPress={ () => setRetry(value => value + 1) }>{ t('common:actions.retry') }</Button>
    </div>
  );

  const placement = request.placement;
  if (!placement) return <p role="status" className="p-8 text-muted">{ t('placements:details.missing') }</p>;

  const faces = [...(placement.faces ?? [])].sort((a, b) =>
    (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id.localeCompare(b.id)
  );
  const selectedIndex = Math.max(0, faces.findIndex(face => face.id === selectedFaceId));
  const selectedFace = faces[selectedIndex];
  const images = selectedFace?.images ?? [];
  const selectedImage = images[selectedImageIndex] ?? images[0];
  const pricing = facePrice(selectedFace, i18n.resolvedLanguage);
  const location = [placement.display_name || placement.city, placement.state, placement.country]
    .filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', ');
  const latitude = Number(placement.latitude);
  const longitude = Number(placement.longitude);
  const hasCoordinates = placement.latitude != null && placement.longitude != null
    && Number.isFinite(latitude) && Number.isFinite(longitude);
  const published = placement.owner_status === 'active' && placement.review_status === 'approved';
  const canShare = published && (
    placement.visibility === 'public' || (placement.visibility === 'unlisted' && Boolean(shareToken))
  );
  const typeLabel = t(`placements:types.${placement.type}`, { defaultValue: placement.type });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <>
      { not(isDialog) &&
        <Header>
          <div className="w-full h-full flex items-center">
            <Typography type="h4" className="truncate">
              <p className="truncate">
                { placement.code }
              </p>
            </Typography>
          </div>
        </Header>
      }
      <article className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="mb-5 flex items-center justify-between gap-3 text-sm text-muted">
          <nav aria-label={ t('common:a11y.breadcrumb') }>
            <Link to="/" className="hover:underline">{ t('placements:details.home') }</Link> / { placement.code }
          </nav>
          { isDialog && <Button variant="ghost" onPress={ () => navigate(-1) }>
            <Icon name="close" /> { t('common:actions.close') }
          </Button> }
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-semibold text-accent">{ typeLabel } · { placement.code }</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">{ placement.display_name || [typeLabel, location].filter(Boolean).join(' · ') }</h1>
            {/* { location && <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Icon name="pin-drop" filled /> { location }
            </p> } */}
          </div>
          <FlatCard className="py-1.5 text-sm">
            { t('placements:faceCount', { count: faces.length }) }
          </FlatCard>
        </div>

        <div className={ `grid gap-2 ${images.length > 1 ? 'sm:grid-cols-[2fr_1fr]' : ''}` }>
          <div className="flex min-h-55 items-center justify-center overflow-hidden bg-surface-secondary sm:min-h-72">
            { selectedImage
              ? <img src={ selectedImage } alt={ `${placement.code} · ${t('placements:details.face')} ${selectedIndex + 1}` } className="h-full max-h-110 w-full object-cover" />
              : <div className="flex flex-col items-center gap-2 text-muted">
                  <Icon name="image" />
                  <span>{ t('placements:details.noImages') }</span>
                </div>
            }
          </div>
          { images.length > 1 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            { images.slice(0, 2).map((image, index) => (
              <button
                key={ `${image}-${index}` }
                type="button"
                aria-label={ t('placements:details.viewLabel', { number: index + 1 }) }
                aria-pressed={ selectedImageIndex === index }
                onClick={ () => setSelectedImageIndex(index) }
                className={ `min-h-25 overflow-hidden bg-surface-secondary focus-visible:outline-2 focus-visible:outline-accent ${selectedImageIndex === index ? 'ring-2 ring-accent' : ''}` }
              >
                <img src={ image } alt="" className="h-full max-h-36 w-full object-cover" />
              </button>
            )) }
          </div> }
        </div>
        { images.length > 2 && <div className="mt-2 flex flex-wrap gap-2">
          { images.slice(2).map((image, index) => (
            <button
              key={ `${image}-${index + 2}` }
              type="button"
              aria-label={ t('placements:details.viewLabel', { number: index + 3 }) }
              aria-pressed={ selectedImageIndex === index + 2 }
              onClick={ () => setSelectedImageIndex(index + 2) }
              className={ `h-20 w-24 overflow-hidden bg-surface-secondary focus-visible:outline-2 focus-visible:outline-accent ${selectedImageIndex === index + 2 ? 'ring-2 ring-accent' : ''}` }
            >
              <img src={ image } alt="" className="h-full w-full object-cover" />
            </button>
          )) }
        </div> }

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(230px,320px)]">
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-semibold">{ t('placements:details.description') }</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-muted">{ placement.description || t('placements:details.noDescription') }</p>
              { placement.structure_height != null && <p className="mt-4 flex items-center gap-2 text-sm">
                <Icon name="height" /> { t('placements:details.height') }: { placement.structure_height } { t('placements:details.meters') }
              </p> }
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">{ t('placements:details.faces') }</h2>
              <div className="flex flex-wrap gap-2" role="group" aria-label={ t('placements:details.faces') }>
                { faces.map((face, index) => (
                  <Button
                    key={ face.id }
                    variant={ selectedIndex === index ? 'primary' : 'secondary' }
                    aria-pressed={ selectedIndex === index }
                    onPress={ () => { setSelectedFaceId(face.id); setSelectedImageIndex(0); } }
                  >
                    { t('placements:details.faceLabel', { number: index + 1 }) }
                  </Button>
                )) }
              </div>
              { selectedFace &&
              <FlatCard className="mt-4 grid gap-3 p-4 text-sm sm:grid-cols-2">
                { selectedFace.display_width != null && selectedFace.display_height != null &&
                <div>
                  <dt className="text-muted">{ t('placements:details.dimensions') }</dt>
                  <dd className="mt-1 font-medium">{ selectedFace.display_width } × { selectedFace.display_height } { t('placements:details.meters') }</dd>
                </div> }
                { pricing && <div>
                  <dt className="text-muted">{ t('placements:details.days') }</dt>
                  <dd className="mt-1 font-medium">{ t('placements:daysRange', { min: pricing.range[0], max: pricing.range[1] }) }</dd>
                </div> }
              </FlatCard> }
            </section>

            { location && <section>
              <h2 className="mb-2 text-lg font-semibold">
                { t('placements:details.location') }
                {/* <Chip>
                  { latitude }, { longitude }
                </Chip> */}
              </h2>
              { hasCoordinates &&
                <GoogleMapsView
                  name={ `${placement.code}-map` }
                  coordinates={ `${latitude},${longitude}` }
                  className="w-full flex flex-row gap-2 items-center"
                >
                  <FlatCard
                    rounded="sm"
                    variant="tertiary"
                    className="w-10 h-10 flex items-center justify-center"
                  >
                    <span className="text-lg">
                      <Icon name="pin-drop" filled />
                    </span>
                  </FlatCard>
                  <div className="w-full flex flex-col overflow-hidden gap-1">
                    <p className="text-sm text-muted truncate">{ location }</p>
                    <Chip>
                      { latitude }, { longitude }
                    </Chip>
                  </div>
                </GoogleMapsView>
              }
              { /* <a
                href={ `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}` }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-accent underline"
              >{ t('placements:details.map') }</a> */}
            </section> }
          </div>

          <FlatCard className="h-fit p-5">
            <p className="text-sm text-muted">{ selectedFace ? t('placements:details.faceLabel', { number: selectedIndex + 1 }) : t('placements:details.faces') }</p>
            <h2 className="mt-2 text-xl font-semibold">{ pricing ? t('placements:details.fromPrice', { price: pricing.formatted }) : t('placements:details.noPrice') }</h2>
            { pricing && <p className="mt-1 text-sm text-muted">{ t('placements:days', { count: pricing.range[0] }) }</p> }
            { canShare
              ? <Button className="mt-5 w-full" variant="primary" onPress={ copyLink }>
                  {/* Icono sugerido: link */}
                  <Icon name="favorite" /> { t('placements:details.share') }
                </Button>
              : <p className="mt-5 text-sm text-muted">{ placement.visibility === 'unlisted' ? t('placements:details.unlistedOwner') : t('placements:details.ownerOnly') }</p>
            }
            { copyState && <p className="mt-2 text-sm" role="status">{ copyState === 'copied' ? t('placements:details.copied') : t('placements:details.copyError') }</p> }
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted">{ t('placements:details.noAvailability') }</p>
          </FlatCard>
        </div>
      </article>
    </>
  );
}

export default PlacementDetails;
