import type { ReactNode} from 'react';
import { FormWithValidation } from '@/components/ValidatedForm';
import { useFormBaseContext } from './contexts';

type CriteriaFormProps = {children?: ReactNode}

export function CriteriaForm({ children }: CriteriaFormProps) {
  const baseContext = useFormBaseContext();

  if ( baseContext === undefined ) {
    return <>{children}</>;
  }

  const { afterSubmit, fetcher, ref } = baseContext;

  return (
    <FormWithValidation ref={ref} fetcher={fetcher} method="get" onSubmit={() => {afterSubmit()}}>
      {children}
    </FormWithValidation>
  );
}