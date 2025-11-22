import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Table, type TableColumnDefinitions } from "../Table";
import { useFetcher } from 'react-router';

import { FormBaseContext, PageDataContext, PageDataStateContext } from './contexts'
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
  children?: ReactNode;
}

export function PaginatedTable<ObjectType>({actionPath, columnDefinitions, toKey, selectedKeys, children}: PaginatedTableProps<ObjectType>) {
  const fetcher = useFetcher();
  const [isLoading, setIsLoading] = useState(true);
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const pageDataState = useState<{pageNum: number, pageSize: number}>({pageNum: 1, pageSize: 10});
  const [lastPageNum, setLastPageNum] = useState(0);
  const formRef = useRef<HTMLFormElement|null>(null)

  const base = useMemo(() => {
    return { fetcher, setIsLoading, actionPath, ref: formRef }
  }, [fetcher, setIsLoading, actionPath]);

  useEffect(() => {
    const { data } = fetcher;
    if ( data ) {
      setIsLoading(false);
      try {
        const { objects, pageNum, pageSize, lastPageNum } = data;
        if ([Array.isArray(objects), typeof pageNum === 'number', typeof pageSize === 'number', typeof lastPageNum === 'number'].includes(false)) {
          throw new Error();
        }
        setObjects(objects);
        setLastPageNum(lastPageNum);
      } catch(error) {
        console.error("Invalid Format")
      }
    }
  }, [fetcher.data]);

  return (
    <>
      <FormBaseContext value={base}>
        <PageDataContext value={pageDataState[0]}>
          {children}
        </PageDataContext>
      </FormBaseContext>
      <PageDataStateContext value={pageDataState} >
        <Controller.Component lastPageNum={lastPageNum} isTop={true} />
      </PageDataStateContext>
      <Table columnDefinitions={columnDefinitions} toKey={toKey} selectedKeys={selectedKeys} isLoading={isLoading} objects={objects} />
      <PageDataStateContext value={pageDataState} >
        <Controller.Component lastPageNum={lastPageNum} isTop={false} />
      </PageDataStateContext>
    </>
  );
}