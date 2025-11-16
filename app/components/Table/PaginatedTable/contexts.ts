import { createContext, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { type FetcherWithComponents } from 'react-router';


type FormBaseContextType = {
  fetcher: FetcherWithComponents<unknown>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  actionPath: string;
} | undefined;
export const FormBaseContext = createContext<FormBaseContextType>(undefined);
export function useFormBaseContext() {
  return useContext(FormBaseContext);
}

type PageDataContextType = {
  pageNum: number;
  pageSize: number;
}
const pageDataDefaultValue: PageDataContextType = {pageNum: 1, pageSize: 10};
export const PageDataContext = createContext<PageDataContextType>(pageDataDefaultValue);
export function usePageDataContext() {
  return useContext(PageDataContext);
}

type PageDataStateContextType = [PageDataContextType, Dispatch<SetStateAction<PageDataContextType>>];
export const PageDataStateContext = createContext<PageDataStateContextType>([pageDataDefaultValue, () => {}])
export function usePageDataStateContext() {
  return useContext(PageDataStateContext);
}
