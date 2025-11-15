import { cloneElement, isValidElement, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Children } from 'react';
import { Table, type TableColumnDefinitions } from "./Table";
import { FormWithValidation } from '../ValidatedForm/Form';
import axios from 'axios';

type PaginationFormProps = {children?: React.ReactNode}
type PaginationFormType = ReactElement<PaginationFormProps>;

export function PaginationForm({ children }: PaginationFormProps): PaginationFormType {
  return <></>;
}

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
  children?: PaginationFormType|ReactNode | [PaginationFormType, ReactNode];
}

function loadData<ObjectType>(actionPath: string, params: Record<string, string>, callback: (data: {objects: ObjectType}) => Promise<void>) {
  axios.post(actionPath, params).then(async (result) => {
    console.log(result.data)
    callback(result.data);
  });
}

export function PaginatedTable<ObjectType>({actionPath, columnDefinitions, toKey, selectedKeys, children}: PaginatedTableProps<ObjectType>) {
  const [isLoading, setIsLoading] = useState(true);
  const [objects, setObjects] = useState<ObjectType[]>([]);

  const [formElement, hElement] = useMemo((): [PaginationFormType|null, HTMLElement|null] => {
    let formElement: ReactElement|null = null;
    let hElement: ReactNode|null = null;
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        if (child.type === PaginationForm) {
          const _child = child as PaginationFormType;
          const children = _child.props.children
          formElement = <FormWithValidation onSubmit={(_, formDataRecord) => {
            loadData(actionPath, formDataRecord, async () => {});
          }} >{children}</FormWithValidation>
        } else {
          hElement = child;
        }
      }
    });
    return [formElement, hElement];
  }, []);

  return (
    <>
      {formElement}
      {hElement}
      <Table columnDefinitions={columnDefinitions} toKey={toKey} selectedKeys={selectedKeys} isLoading={isLoading} objects={objects} />
    </>
  );
}