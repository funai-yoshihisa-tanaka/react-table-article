import { cloneElement, isValidElement, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { Children } from 'react';
import { Table, type TableColumnDefinitions } from "./Table";
import { FormWithValidation } from '../ValidatedForm/Form';
import axios from 'axios';

type PaginationFormProps = {children?: React.ReactNode}
type PaginationFormType = ReactElement<PaginationFormProps>;

export function PaginationForm({}: PaginationFormProps): PaginationFormType {
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

function loadData<ObjectType>(
  actionPath: string,
  params: Record<string, string>,
  onSuccess: (data: {objects: ObjectType}) => void | Promise<void>,
  onFailed: (data: any) => void | Promise<void>
) {
  axios.postForm(actionPath, params).then(async (result) => {
    console.log(result.data)
    onSuccess(result.data);
  }).catch(onFailed);
}

export function PaginatedTable<ObjectType>({actionPath, columnDefinitions, toKey, selectedKeys, children}: PaginatedTableProps<ObjectType>) {
  const [isLoading, setIsLoading] = useState(true);
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [_formElement, hElement] = useMemo((): [PaginationFormType|null, HTMLElement|null] => {
    let formElement: ReactElement|null = null;
    let hElement: ReactNode|null = null;
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        if (child.type === PaginationForm) {
          const _child = child as PaginationFormType;
          const children = _child.props.children
          formElement = <FormWithValidation onSubmit={(_, formDataRecord) => {
            loadData(actionPath, formDataRecord, async () => {}, (data) => {
              console.log(data)
            });
          }} >{children}</FormWithValidation>
        } else {
          hElement = child;
        }
      }
    });
    return [formElement, hElement];
  }, []);

  const formElement = useMemo(() => {
    return _formElement ? _formElement : <FormWithValidation onSubmit={() => {
      loadData(actionPath, { pageNum: `${pageNum}`, pageSize: `${pageSize}` }, async () => {}, (data) => {
        console.log(data)
      });
    }} ></FormWithValidation>
  }, [_formElement]);

  return (
    <>
      {formElement}
      {hElement}
      <Table columnDefinitions={columnDefinitions} toKey={toKey} selectedKeys={selectedKeys} isLoading={isLoading} objects={objects} />
    </>
  );
}