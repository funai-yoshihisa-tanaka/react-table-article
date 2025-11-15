import { useEffect, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import { useFormDispatch } from '../Form';

export function NoValidationInput({onFocus, ...props}: InputHTMLAttributes<HTMLInputElement>) {
  const set = useFormDispatch();
  const myId = useId();

  useEffect(() => {
    set.didPassData((prev) => {
      return {...prev, [myId]: true};
    });
  }, [myId, set]);

  return (
    <input
      onFocus={(e) => {
        set.event()
        if (onFocus) {
          onFocus(e)
        }
      }}
      {...props}
    />
  );
}