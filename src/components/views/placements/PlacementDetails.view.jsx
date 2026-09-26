import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { formatCurrency, parseDayRange } from '@/helpers/utilities.helpers';
import { useAuth, useLanguage } from '@/hooks/contexts';
import { MIN_RENT_DAYS } from '@/settings/defaults.settings';
import { SYSTEM } from '@/settings/langs.settings';
import { placementsService } from '@/services/placements.service';
import { Icon } from '@/components/ui';

const COPY = {
  es: {
    home: 'Explorar', loading: 'Cargando detalles...', missing: 'Este espacio no está disponible.',
    error: 'No pudimos cargar los detalles. Inténtalo de nuevo.', retry: 'Reintentar',
    faces: 'Caras del espacio', face: 'Cara', description: 'Sobre este espacio',
    noDescription: 'El propietario aún no agregó una descripción.', location: 'Ubicación',
    height: 'Altura de la estructura', dimensions: 'Medidas de exhibición',
    days: 'Periodo de renta', from: 'Desde',
    noPrice: 'Precio no disponible', noImages: 'Imagen no disponible',
    view: 'Vista', share: 'Copiar enlace', copied: 'Enlace copiado',
    copyError: 'No se pudo copiar el enlace', ownerOnly: 'Este espacio solo es visible para ti.',
    unlistedOwner: 'Puedes copiar el enlace no listado desde el inventario cuando el espacio esté aprobado y activo.',
    noAvailability: 'La disponibilidad todavía no se muestra en esta página.',
    map: 'Ver ubicación', meters: 'm', dayUnit: 'días', close: 'Cerrar'
  },
  en: {
    home: 'Explore', loading: 'Loading details...', missing: 'This placement is unavailable.',
    error: 'Could not load the details. Please try again.', retry: 'Retry',
    faces: 'Placement faces', face: 'Face', description: 'About this placement',
    noDescription: 'The owner has not added a description yet.', location: 'Location',
    height: 'Structure height', dimensions: 'Display dimensions',
    days: 'Rental period', from: 'From',
    noPrice: 'Price unavailable', noImages: 'No image available',
    view: 'View', share: 'Copy link', copied: 'Link copied',
    copyError: 'Could not copy the link', ownerOnly: 'Only you can see this placement.',
    unlistedOwner: 'Copy the unlisted link from inventory once the placement is approved and active.',
    noAvailability: 'Availability is not shown on this page yet.',
    map: 'View location', meters: 'm', dayUnit: 'days', close: 'Close'
  }
};

const facePrice = (face) => {
  const range = parseDayRange(face?.day_range);
  const price = Number(face?.period_price);

  if (!range || face?.period_price == null || !Number.isFinite(price)) return null;

  return {
    formatted: formatCurrency(price * range[0] / MIN_RENT_DAYS),
    range
  };
};

function PlacementDetails({ isDialog = false }) {
  const { code, id, shareToken } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const text = COPY[language] ?? COPY.es;
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

  if (request.key !== requestKey) return <p role="status" className="p-8 text-muted">{ text.loading }</p>;

  if (request.error) return (
    <div role="alert" className="flex flex-col items-start gap-3 p-8">
      <p>{ text.error }</p>
      <Button variant="secondary" onPress={ () => setRetry(value => value + 1) }>{ text.retry }</Button>
    </div>
  );

  const placement = request.placement;
  if (!placement) return <p role="status" className="p-8 text-muted">{ text.missing }</p>;

  const faces = [...(placement.faces ?? [])].sort((a, b) =>
    (a.created_at ?? '').localeCompare(b.created_at ?? '') || a.id.localeCompare(b.id)
  );
  const selectedIndex = Math.max(0, faces.findIndex(face => face.id === selectedFaceId));
  const selectedFace = faces[selectedIndex];
  const images = selectedFace?.images ?? [];
  const selectedImage = images[selectedImageIndex] ?? images[0];
  const pricing = facePrice(selectedFace);
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
  const typeLabel = SYSTEM[language]?.PLACEMENT?.TYPES?.[placement.type] ?? placement.type;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <article className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex items-center justify-between gap-3 text-sm text-muted">
        <nav aria-label="Breadcrumb">
          <Link to="/" className="hover:underline">{ text.home }</Link> / { placement.code }
        </nav>
        { isDialog && <Button variant="ghost" onPress={ () => navigate(-1) }>
          {/* Icono sugerido: close */}
          <Icon name="favorite" /> { text.close }
        </Button> }
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-semibold text-accent">{ typeLabel } · { placement.code }</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">{ placement.display_name || [typeLabel, location].filter(Boolean).join(' · ') }</h1>
          { location && <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            {/* Icono sugerido: pin-drop */}
            <Icon name="favorite" /> { location }
          </p> }
        </div>
        <span className="rounded-full bg-surface-secondary px-3 py-1.5 text-sm">
          { faces.length } { text.faces.toLowerCase() }
        </span>
      </div>

      <div className={ `grid gap-2 ${images.length > 1 ? 'sm:grid-cols-[2fr_1fr]' : ''}` }>
        <div className="flex min-h-55 items-center justify-center overflow-hidden rounded-2xl bg-surface-secondary sm:min-h-72">
          { selectedImage
            ? <img src={ selectedImage } alt={ `${placement.code} · ${text.face} ${selectedIndex + 1}` } className="h-full max-h-110 w-full object-cover" />
            : <div className="flex flex-col items-center gap-2 text-muted">
                {/* Icono sugerido: image */}
                <Icon name="favorite" />
                <span>{ text.noImages }</span>
              </div>
          }
        </div>
        { images.length > 1 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          { images.slice(0, 2).map((image, index) => (
            <button
              key={ `${image}-${index}` }
              type="button"
              aria-label={ `${text.view} ${index + 1}` }
              aria-pressed={ selectedImageIndex === index }
              onClick={ () => setSelectedImageIndex(index) }
              className={ `min-h-25 overflow-hidden rounded-2xl bg-surface-secondary focus-visible:outline-2 focus-visible:outline-accent ${selectedImageIndex === index ? 'ring-2 ring-accent' : ''}` }
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
            aria-label={ `${text.view} ${index + 3}` }
            aria-pressed={ selectedImageIndex === index + 2 }
            onClick={ () => setSelectedImageIndex(index + 2) }
            className={ `h-20 w-24 overflow-hidden rounded-xl bg-surface-secondary focus-visible:outline-2 focus-visible:outline-accent ${selectedImageIndex === index + 2 ? 'ring-2 ring-accent' : ''}` }
          >
            <img src={ image } alt="" className="h-full w-full object-cover" />
          </button>
        )) }
      </div> }

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(230px,320px)]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold">{ text.description }</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-muted">{ placement.description || text.noDescription }</p>
            { placement.structure_height != null && <p className="mt-4 flex items-center gap-2 text-sm">
              {/* Icono sugerido: height */}
              <Icon name="favorite" /> { text.height }: { placement.structure_height } { text.meters }
            </p> }
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{ text.faces }</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label={ text.faces }>
              { faces.map((face, index) => (
                <Button
                  key={ face.id }
                  variant={ selectedIndex === index ? 'primary' : 'secondary' }
                  aria-pressed={ selectedIndex === index }
                  onPress={ () => { setSelectedFaceId(face.id); setSelectedImageIndex(0); } }
                >
                  { text.face } { index + 1 }
                </Button>
              )) }
            </div>
            { selectedFace && <dl className="mt-4 grid gap-3 rounded-xl bg-surface-secondary p-4 text-sm sm:grid-cols-2">
              { selectedFace.display_width != null && selectedFace.display_height != null && <div>
                <dt className="text-muted">{ text.dimensions }</dt>
                <dd className="mt-1 font-medium">{ selectedFace.display_width } × { selectedFace.display_height } { text.meters }</dd>
              </div> }
              { pricing && <div>
                <dt className="text-muted">{ text.days }</dt>
                <dd className="mt-1 font-medium">{ pricing.range[0] }–{ pricing.range[1] } { text.dayUnit }</dd>
              </div> }
            </dl> }
          </section>

          { location && <section>
            <h2 className="mb-2 text-lg font-semibold">{ text.location }</h2>
            <p className="text-sm text-muted">{ location }</p>
            { hasCoordinates && <a
              href={ `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}` }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-accent underline"
            >{ text.map }</a> }
          </section> }
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">{ selectedFace ? `${text.face} ${selectedIndex + 1}` : text.faces }</p>
          <h2 className="mt-2 text-xl font-semibold">{ pricing ? `${text.from} ${pricing.formatted}` : text.noPrice }</h2>
          { pricing && <p className="mt-1 text-sm text-muted">{ pricing.range[0] } { text.dayUnit }</p> }
          { canShare
            ? <Button className="mt-5 w-full" variant="primary" onPress={ copyLink }>
                {/* Icono sugerido: link */}
                <Icon name="favorite" /> { text.share }
              </Button>
            : <p className="mt-5 text-sm text-muted">{ placement.visibility === 'unlisted' ? text.unlistedOwner : text.ownerOnly }</p>
          }
          { copyState && <p className="mt-2 text-sm" role="status">{ copyState === 'copied' ? text.copied : text.copyError }</p> }
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted">{ text.noAvailability }</p>
        </aside>
      </div>
    </article>
  );
}

export default PlacementDetails;
