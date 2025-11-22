import { PaginatedTable, CriteriaForm, type TableColumnDefinitions } from "@/components/Table";
import { NoValidationInput, ClearButton } from '@/components/ValidatedForm';

type ObjectType = {id: number, text: string};


const tableColumnDefinitions: TableColumnDefinitions<ObjectType> = [
  {
    key: 'id',
    thContent: 'ID',
    getTdContent: (object) => `${object.id}`,
    widthRem: 10,
  },
  {
    key: 'text',
    thContent: 'Text',
    getTdContent: (object) => object.text,
    widthRem: 10,
  },
];

export default function PaginatedTablePage() {
  return (
    <>
      <PaginatedTable actionPath='/search-paginated-table' columnDefinitions={tableColumnDefinitions} toKey={(obj: ObjectType) => obj.id} >
        <CriteriaForm>
          <NoValidationInput name="test" />
          <p>
            <ClearButton>クリア</ClearButton>
            <button >検索</button>
          </p>
        </CriteriaForm>
        <h3>テーブル</h3>
      </PaginatedTable>
    </>
  );
}
