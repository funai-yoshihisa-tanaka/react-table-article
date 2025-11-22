import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction, Ref, RefObject } from 'react';
import { type FetcherWithComponents } from 'react-router';


type FormBaseContextType = {
  fetcher: FetcherWithComponents<unknown>;
  ref: Ref<HTMLFormElement|null>;
  afterSubmit: () => void;
} | undefined;
export const FormBaseContext = createContext<FormBaseContextType>(undefined);
export function useFormBaseContext() {
  return useContext(FormBaseContext);
}

type PageDataContextType = {
  pageNum: number;
  pageSize: number;
}

type ControllerContextType = {
  fetcher: FetcherWithComponents<unknown>;
  state: [PageDataContextType, Dispatch<SetStateAction<PageDataContextType>>];
  submit: (newPageData?: {pageNum: number, pageSize: number}) => void;
} | undefined;
export const ControllerContext = createContext<ControllerContextType>(undefined);
export function useControllerContext() {
  return useContext(ControllerContext);
}
