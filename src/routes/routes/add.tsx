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
import { zodResolver } from '@hookform/resolvers/zod';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect,useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { postRouteReq } from '@/apis/routes';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartRoute } from '@/components/form-slice/FormPartRoute';
import {
  RoutePostSchema,
  type RoutePostType,
} from '@/components/form-slice/FormPartRoute/schema';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import PageHeader from '@/components/page/PageHeader';
import { req } from '@/config/req';
import type { APISIXType } from '@/types/schema/apisix';
import { produceRmUpstreamWhenHas } from '@/utils/form-producer';
import { pipeProduce } from '@/utils/producer';

type Props = {
  navigate: (res: APISIXType['RespRouteDetail']) => Promise<void>;
  defaultValues?: Partial<RoutePostType>;
};

export const RouteAddForm = (props: Props) => {
  const { navigate, defaultValues } = props;
  const { t } = useTranslation();

  const postRoute = useMutation({
    mutationFn: (d: RoutePostType) =>
      postRouteReq(req, pipeProduce(produceRmUpstreamWhenHas('service_id'))(d)),
    async onSuccess(res) {
      notifications.show({
        message: t('info.add.success', { name: t('routes.singular') }),
        color: 'green',
      });
      await navigate(res);
    },
  });

  const form = useForm({
    resolver: zodResolver(RoutePostSchema),
    shouldUnregister: true,
    shouldFocusError: true,
    mode: 'all',
    defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d) => postRoute.mutateAsync(d))}>
        <FormPartRoute />
        <FormSubmitBtn>{t('form.btn.add')}</FormSubmitBtn>
      </form>
    </FormProvider>
  );
};

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: '/routes/add' });
  
  // Parse duplicate data from session storage
  const duplicateData = useMemo(() => {
    if (!search.duplicateId) return undefined;
    
    try {
      const stored = sessionStorage.getItem(search.duplicateId);
      if (!stored) return undefined;
      
      const parsed = JSON.parse(stored);
      return parsed;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse duplicate data:', error);
      return undefined;
    }
  }, [search.duplicateId]);

  // Clean up session storage after component mounts
  useEffect(() => {
    if (search.duplicateId && duplicateData) {
      // Clean up after a short delay to ensure the form has been populated
      const cleanup = () => {
        try {
          if (search.duplicateId) {
            sessionStorage.removeItem(search.duplicateId);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to cleanup duplicate data:', error);
        }
      };
      
      // Cleanup after component mounts and form is initialized
      const timeoutId = setTimeout(cleanup, 1000);
      
      return () => {
        clearTimeout(timeoutId);
        cleanup();
      };
    }
  }, [search.duplicateId, duplicateData]);

  return (
    <>
      <PageHeader 
        title={
          duplicateData 
            ? t('info.duplicate.title', { name: t('routes.singular') })
            : t('info.add.title', { name: t('routes.singular') })
        } 
      />
      <FormTOCBox>
        <RouteAddForm
          defaultValues={duplicateData}
          navigate={(res) =>
            navigate({
              to: '/routes/detail/$id',
              params: { id: res.data.value.id },
            })
          }
        />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/routes/add')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    duplicateId: search.duplicateId as string | undefined,
  }),
});
