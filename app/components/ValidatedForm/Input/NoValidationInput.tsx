import { useEffect, useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

import { useFormDispatch } from '../Form';

export function NoValidationInput({onFocus, onChange, ...props}: InputHTMLAttributes<HTMLInputElement>) {
  const { setDidPassData, cancelPendingSubmit, setClearFunctions, removeClearFunctions } = useFormDispatch();
  const [value, setValue] = useState('');
  const myId = useId();

  useEffect(() => {
    setDidPassData((prev) => {
      return {...prev, [myId]: true};
    });
    setClearFunctions(myId, () => {
      setValue('');
    });
  }, [myId, setDidPassData, setClearFunctions, removeClearFunctions]);

  return (
    <input
      onFocus={(e) => {
        cancelPendingSubmit()
        if (onFocus) {
          onFocus(e)
        }
      }}
      onChange={(e) => {
        setValue(e.target.value);
        if (onChange) {
          onChange(e);
        }
      }}
      value={value}
      {...props}
    />
  );
}