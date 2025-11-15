import { Table, type TableColumnDefinitions } from "@/components/Table";
import { useEffect, useState } from "react";

type ObjectType1 = {id: number, text: string};
type ObjectType2 = {id: number, text: string, comment: string};

export default function Home() {
  const table1ColumnDefinitions: TableColumnDefinitions<ObjectType1> = [
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
  const objects1: ObjectType1[] = [
    {
      id: 1,
      text: 'text1'
    },
    {
      id: 2,
      text: 'text2'
    }
  ];

  const table2ColumnDefinitions: TableColumnDefinitions<ObjectType2> = [
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
    {
      key: 'comment',
      thContent: 'Comment',
      getTdContent: (object) => object.comment,
      widthRem: 10,
    },
  ];
  const objects2: ObjectType2[] = [
    {
      id: 3,
      text: '2-3',
      comment: 'comment-3'
    },
    {
      id: 4,
      text: '2-4',
      comment: 'comment-4'
    },
    {
      id: 5,
      text: '2-5',
      comment: 'comment-5'
    }
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>();

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
      setSelectedKeys(['text', 'comment'])
    }, 5000);
  }, []);

  return (
    <>
      <Table columnDefinitions={table1ColumnDefinitions} toKey={(obj) => obj.id} objects={objects1} isLoading={isLoading} />
      <Table columnDefinitions={table1ColumnDefinitions} toKey={(obj) => obj.id} objects={[]} isLoading={isLoading} />
      <Table columnDefinitions={table2ColumnDefinitions} toKey={(obj) => obj.id} selectedKeys={selectedKeys} objects={objects2} />
    </>
  );
}
