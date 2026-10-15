import { useTranslation } from 'react-i18next';
import { Chip } from '@heroui/react';

const colors = { approved: 'success', rejected: 'danger', suspended: 'danger', pending: 'warning', in_review: 'accent' };
export default function ReviewStatus({ status }) {
  const { t } = useTranslation();
  return <Chip size="sm" variant="soft" color={ colors[status] ?? 'default' }>{ t(`placements:reviewStatuses.${status}`, { defaultValue: status }) }</Chip>;
}
