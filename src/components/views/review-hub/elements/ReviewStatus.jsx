import { Chip } from '@heroui/react';

const colors = { approved: 'success', rejected: 'danger', suspended: 'danger', pending: 'warning', in_review: 'accent' };
export default function ReviewStatus({ status, text }) {
  return <Chip size="sm" variant="soft" color={ colors[status] ?? 'default' }>{ text.states[status] ?? status }</Chip>;
}
