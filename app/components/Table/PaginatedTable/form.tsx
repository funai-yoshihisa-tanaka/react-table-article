import { useCallback, useEffect, useMemo, useRef, type ReactNode} from 'react';
import { FormWithValidation } from '@/components/ValidatedForm';
import { useFormBaseContext, usePageDataContext } from './contexts';

type CriteriaFormProps = {children?: ReactNode}

export function CriteriaForm({ children }: CriteriaFormProps) {
  const baseContext = useFormBaseContext();

  if ( baseContext === undefined ) {
    return <>{children}</>;
  }

  const { fetcher, actionPath, setIsLoading } = baseContext;

  const { pageNum, pageSize } = usePageDataContext();

  const hiddenButtonRef = useRef<HTMLButtonElement|null>(null);
  const hiddenButton = useMemo(() => {
    return (<button className='hidden' ref={hiddenButtonRef} />)
  }, [hiddenButtonRef]);

  const afterSubmit = useCallback((_: unknown, formDataRecord: Record<string, string>) => {
    setIsLoading(true);
    fetcher.submit({...formDataRecord, pageNum, pageSize}, { method: 'post', action: actionPath });
  }, [actionPath, fetcher, pageNum, pageSize, setIsLoading])

  useEffect(() => {
    hiddenButtonRef.current?.click();
  }, [pageNum, pageSize, hiddenButtonRef.current]);

  return (
    <FormWithValidation fetcher={fetcher} actionPath={actionPath} method="post" onSubmit={afterSubmit} >
      {children}
      {hiddenButton}
    </FormWithValidation>
  );
}