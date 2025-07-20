/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tooltip } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getRouteListQueryOptions, useRouteList } from '@/apis/hooks';
import type { WithServiceIdFilter } from '@/apis/routes';
import { putRouteReq } from '@/apis/routes';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { API_ROUTES } from '@/config/constant';
import { queryClient } from '@/config/global';
import { req } from '@/config/req';
import type { APISIXType } from '@/types/schema/apisix';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { produceTime } from '@/utils/form-producer';
import { pipeProduce } from '@/utils/producer';
import type { ListPageKeys } from '@/utils/useTablePagination';
import IconContentCopy from '~icons/material-symbols/content-copy';
import IconPowerSettingsNew from '~icons/material-symbols/power-settings-new';

export type RouteListProps = {
  routeKey: Extract<ListPageKeys, '/routes/' | '/services/detail/$id/routes/'>;
  defaultParams?: Partial<WithServiceIdFilter>;
  ToDetailBtn: (props: {
    record: APISIXType['RespRouteItem'];
  }) => React.ReactNode;
};

export const RouteList = (props: RouteListProps) => {
  const { routeKey, ToDetailBtn, defaultParams } = props;
  const { data, isLoading, refetch, pagination } = useRouteList(
    routeKey,
    defaultParams
  );
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleDuplicate = useCallback((record: APISIXType['RespRouteItem']) => {
    const duplicateData = {
      ...record.value,
      name: `${record.value.name}_copy_${Date.now()}`,
      id: undefined,
      create_time: undefined,
      update_time: undefined,
    };
    
    // Generate unique session storage key
    const duplicateId = `route_duplicate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store data in session storage
    try {
      sessionStorage.setItem(duplicateId, JSON.stringify(duplicateData));
      navigate({
        to: '/routes/add',
        search: { duplicateId }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to store duplicate data:', error);
      // Fallback to direct navigation without duplication
      navigate({ to: '/routes/add', search: { duplicateId: undefined } });
    }
  }, [navigate]);

  const handleToggleOnline = useMutation({
    mutationFn: (route: APISIXType['Route']) => putRouteReq(req, route),
    onSuccess: () => {
      refetch();
    },
  });

  const DuplicateBtn = useCallback(({ record }: { record: APISIXType['RespRouteItem'] }) => (
    <Tooltip label={t('form.btn.duplicate')}>
      <Button
        size="compact-xs"
        variant="light"
        color="blue"
        onClick={() => handleDuplicate(record)}
      >
        <IconContentCopy />
      </Button>
    </Tooltip>
  ), [t, handleDuplicate]);

  const ToggleOnlineBtn = useCallback(({ record }: { record: APISIXType['RespRouteItem'] }) => {
    const isOnline = record.value.status === 1;
    const handleClick = () => {
      const updatedRoute = {
        ...record.value,
        status: (isOnline ? 0 : 1) as 0 | 1,
      };
      // Use the existing utility to remove forbidden fields
      const cleanRoute = pipeProduce(produceTime)(updatedRoute);
      handleToggleOnline.mutate(cleanRoute);
    };
    
    return (
      <Tooltip label={isOnline ? t('form.btn.offline') : t('form.btn.online')}>
        <Button
          size="compact-xs"
          variant="light"
          color={isOnline ? 'red' : 'green'}
          onClick={handleClick}
          loading={handleToggleOnline.isPending}
        >
          <IconPowerSettingsNew />
        </Button>
      </Tooltip>
    );
  }, [t, handleToggleOnline]);

  const columns = useMemo<ProColumns<APISIXType['RespRouteItem']>[]>(() => {
    return [
      {
        dataIndex: ['value', 'id'],
        title: 'ID',
        key: 'id',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'name'],
        title: t('form.basic.name'),
        key: 'name',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'desc'],
        title: t('form.basic.desc'),
        key: 'desc',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'uri'],
        title: 'URI',
        key: 'uri',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'status'],
        title: t('form.basic.status'),
        key: 'status',
        valueType: 'select',
        valueEnum: {
          1: { text: t('table.enabled'), status: 'Success' },
          0: { text: t('table.disabled'), status: 'Error' },
        },
      },
      {
        title: t('table.actions'),
        valueType: 'option',
        key: 'option',
        width: 200,
        render: (_, record) => [
          <ToDetailBtn key="detail" record={record} />,
          <DuplicateBtn key="duplicate" record={record} />,
          <ToggleOnlineBtn key="toggle-online" record={record} />,
          <DeleteResourceBtn
            key="delete"
            name={t('routes.singular')}
            target={record.value.id}
            api={`${API_ROUTES}/${record.value.id}`}
            onSuccess={refetch}
          />,
        ],
      },
    ];
  }, [t, ToDetailBtn, refetch, DuplicateBtn, ToggleOnlineBtn]);

  return (
    <AntdConfigProvider>
      <ProTable
        columns={columns}
        dataSource={data.list}
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        pagination={pagination}
        cardProps={{ bodyStyle: { padding: 0 } }}
        toolbar={{
          menu: {
            type: 'inline',
            items: [
              {
                key: 'add',
                label: (
                  <ToAddPageBtn
                    key="add"
                    label={t('info.add.title', {
                      name: t('routes.singular'),
                    })}
                    to={`${routeKey}add`}
                  />
                ),
              },
            ],
          },
        }}
      />
    </AntdConfigProvider>
  );
};

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.routes')} />
      <RouteList
        routeKey="/routes/"
        ToDetailBtn={({ record }) => (
          <ToDetailPageBtn
            key="detail"
            to="/routes/detail/$id"
            params={{ id: record.value.id }}
          />
        )}
      />
    </>
  );
}

export const Route = createFileRoute('/routes/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    queryClient.ensureQueryData(getRouteListQueryOptions(deps)),
});
