import { useEffect, useState } from 'react';
import { Button, Tabs } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { FlatCard } from '@/components/ui';
import { useAuth } from '@/hooks/contexts';
import { dashboardService } from '@/services/dashboard.service';

const QUEUE_LINKS = {
  unassigned: '/review-hub#unassigned',
  mine: '/review-hub#mine',
  reassign: '/review-hub#reassign'
};

function StatCard({ label, value, href }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <FlatCard className="flex min-h-32 flex-col justify-between gap-3">
      <p className="text-sm text-muted">{ label }</p>
      <div className="flex items-end justify-between gap-3">
        <strong className="text-3xl">{ value }</strong>
        <Button size="sm" variant="tertiary" onPress={ () => navigate(href) }>
          { t('common:dashboard.view') }
        </Button>
      </div>
    </FlatCard>
  );
}

function DashboardContent({ role }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState({ role: null, userId: null, data: null, error: null });

  useEffect(() => {
    let active = true;
    const load = role === 'owner'
      ? dashboardService.owner(user.id)
      : dashboardService.review(role === 'admin');

    load.then(data => {
      if (active) setResult({ role, userId: user.id, data, error: null });
    }).catch(error => {
      if (active) setResult({ role, userId: user.id, data: null, error });
    });
    return () => { active = false; };
  }, [role, user.id]);

  const isLoading = result.role !== role || result.userId !== user.id;
  const data = isLoading ? null : result.data;
  const cards = role === 'owner'
    ? [
        ['approved', data?.approved, '/inventory#approved'],
        ['reviewing', data?.reviewing, '/inventory#reviewing'],
        ['attention', data?.attention, '/inventory#attention']
      ]
    : [
        ['unassigned', data?.unassigned, QUEUE_LINKS.unassigned],
        ['minePending', data?.minePending, QUEUE_LINKS.mine],
        ['mineReviewing', data?.mineReviewing, QUEUE_LINKS.mine],
        ...(role === 'admin' ? [['reassign', data?.reassign, QUEUE_LINKS.reassign]] : [])
      ];

  return (
    <div className="w-full space-y-6 p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        { cards.map(([key, value, href]) =>
          <StatCard
            key={ key }
            label={ t(`common:dashboard.stats.${key}`) }
            value={ value ?? '—' }
            href={ href }
          />
        ) }
      </div>
      { !isLoading && result.error &&
        <p role="alert" className="text-danger">{ t('common:dashboard.error') }</p>
      }
      <section aria-label={ t('common:dashboard.next') } className="space-y-3">
        <h2 className="text-lg font-semibold">{ t('common:dashboard.next') }</h2>
        { isLoading && <p role="status">{ t('common:loading') }</p> }
        { data && data.items.length === 0 && <p className="text-muted">{ t('common:dashboard.empty') }</p> }
        { data?.items.map(item =>
          <FlatCard key={ item.id } className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{ item.code }</p>
              <p className="truncate text-sm text-muted">
                { item.display_name || t(`placements:reviewStatuses.${item.review_status}`) }
              </p>
            </div>
            <Button size="sm" variant="secondary" onPress={ () => navigate(
              role === 'owner' ? `/p/${encodeURIComponent(item.code)}` : QUEUE_LINKS[item.queue]
            ) }>
              { t('common:dashboard.view') }
            </Button>
          </FlatCard>
        ) }
      </section>
    </div>
  );
}

function Dashboard({ roles }) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const role = roles.includes(selectedRole) ? selectedRole : roles[0];

  if (roles.length === 1) {
    return <DashboardContent role={ role } />;
  }

  return (
    <Tabs
      selectedKey={ role }
      onSelectionChange={ setSelectedRole }
      className="flex w-full min-h-0 flex-col"
    >
      <Tabs.ListContainer className="mx-4 w-fit">
        <Tabs.List aria-label={ t('common:dashboard.selectRole') }>
          { roles.map(key =>
            <Tabs.Tab key={ key } id={ key }>
              { t(`common:dashboard.roles.${key}`) }
              <Tabs.Indicator />
            </Tabs.Tab>
          ) }
        </Tabs.List>
      </Tabs.ListContainer>
      { roles.map(key =>
        <Tabs.Panel key={ key } id={ key } className="w-full">
          { role === key && <DashboardContent role={ key } /> }
        </Tabs.Panel>
      ) }
    </Tabs>
  );
}

export default Dashboard;
