import { useCallback, type ReactNode} from 'react';
import { FormWithValidation } from '@/components/ValidatedForm';
import { useFormBaseContext, usePageDataContext } from './contexts';

type CriteriaFormProps = {children?: ReactNode}

export function CriteriaForm({ children }: CriteriaFormProps) {
  const baseContext = useFormBaseContext();

  if ( baseContext === undefined ) {
    return <>{children}</>;
  }

  const { fetcher, actionPath, ref, setIsLoading } = baseContext;

  const { pageNum, pageSize } = usePageDataContext();

  const afterSubmit = useCallback((_: unknown, formDataRecord: Record<string, string>) => {
    setIsLoading(true);
    fetcher.submit({...formDataRecord, pageNum, pageSize}, { method: 'post', action: actionPath });
  }, [actionPath, fetcher, pageNum, pageSize, setIsLoading])

  return (
    <FormWithValidation ref={ref} fetcher={fetcher} actionPath={actionPath} method="post" onSubmit={afterSubmit} >
      {children}
    </FormWithValidation>
  );
}