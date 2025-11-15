import type { ActionFunctionArgs } from 'react-router'
// import { useEffect, useState } from "react";
import { PaginatedTable, PaginationForm, type TableColumnDefinitions } from "@/components/Table";
import { NoValidationInput } from '@/components/ValidatedForm';

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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const pageNum = Number(formData.get('pageNum'));
  const objects: ObjectType[] = [];
  for (let i = (pageNum - 1) * 10 + 1; i <= pageNum * 10; i++) {
    objects.push({
      id: i,
      text: `text${i}`,
    });
  }
  return { objects };
}

export default function Home() {
  return (
    <>
      <PaginatedTable actionPath='/paginated-table' columnDefinitions={tableColumnDefinitions} toKey={(obj: ObjectType) => obj.id} >
        <PaginationForm>
          <NoValidationInput name="test" />
          <p>
            <button type="button">クリア</button>
            <button >検索</button>
          </p>
        </PaginationForm>
        <h3>テーブル</h3>
      </PaginatedTable>
    </>
  );
}
