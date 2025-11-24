import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Table, type TableColumnDefinitions } from "../Table";
import { useFetcher } from 'react-router';

import { FormBaseContext, ControllerContext } from './contexts'
import * as Controller from './controller'

type PaginatedTableProps<ObjectType> = {
  actionPath: string;
  /** テーブルの全カラム定義 */
  columnDefinitions: TableColumnDefinitions<ObjectType>;
  /**
   * オブジェクトからReactのkeyとして一意な値を取得する関数
   * (例: (user) => user.id)
   */
  toKey: (object: ObjectType) => string | number;
  /** 表示したいカラムのキー配列 (この配列の順序で表示されます) */
  selectedKeys?: string[];
  isHideController?: boolean
  children?: ReactNode;
}

export function PaginatedTable<ObjectType>({actionPath, isHideController, columnDefinitions, toKey, selectedKeys, children}: PaginatedTableProps<ObjectType>) {
  const fetcher = useFetcher<{ objects: ObjectType[], pageNum: number, pageSize: number, lastPageNum: number }>();
  const pageDataState = useState<{pageNum: number, pageSize: number}>({pageNum: 1, pageSize: 10});
  const formRef = useRef<HTMLFormElement|null>(null);
  const { objects = [], lastPageNum = 0, pageNum } = fetcher.data || {};

  const execSubmit = useCallback((newPageData?: {pageNum: number, pageSize: number}) => {
    if (formRef.current) {
      if (fetcher.state === 'idle') {
        const formData = formRef.current ? new FormData(formRef.current) : new FormData();
        if ( newPageData ) {
          formData.set('pageNum', newPageData.pageNum.toString());
          formData.set('pageSize', newPageData.pageSize.toString());
        } else {
          pageDataState[1](prev => {
            const newPageData = { pageNum: 1, pageSize: prev.pageSize };
            formData.set('pageNum', newPageData.pageNum.toString());
            formData.set('pageSize', newPageData.pageSize.toString());
            return newPageData;
          });
        }
        void fetcher.submit(formData, { method: 'get', action: actionPath });
      }
    }
  }, [actionPath, fetcher, formRef, pageDataState]);

  const formBaseContext = useMemo(() => {
    return { afterSubmit: execSubmit, fetcher, ref: formRef }
  }, [execSubmit, fetcher, formRef]);

  const controllerContext = useMemo(() => {
    return { fetcher, state: pageDataState, submit: execSubmit };
  }, [execSubmit, fetcher, pageDataState]);

  useEffect(() => {
    execSubmit();
  }, []);

  useEffect(() => {
    if ( pageNum !== undefined ) {
      pageDataState[1](prev => prev.pageNum === pageNum ? prev : { pageNum, pageSize: prev.pageSize});
    }
  }, [pageDataState, pageNum]);

  return (
    <>
      <FormBaseContext value={formBaseContext}>
        {children}
      </FormBaseContext>
      {!isHideController && <ControllerContext value={controllerContext} >
        <Controller.Component lastPageNum={lastPageNum} />
      </ControllerContext>}
      <Table columnDefinitions={columnDefinitions} toKey={toKey} selectedKeys={selectedKeys} objects={objects} isLoading={fetcher.state !== 'idle'} />
      {!isHideController && <ControllerContext value={controllerContext} >
        <Controller.Component lastPageNum={lastPageNum} />
      </ControllerContext>}
    </>
  );
}