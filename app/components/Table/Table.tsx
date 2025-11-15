import LoadingSpinner from "@/components/LoadingSpinner";
import { useMemo, useCallback, useEffect, useState } from "react";
import type { FC, ReactNode } from "react";

// --- 1. 型定義 (外部から利用できるように export します) ---

/**
 * 各カラムの定義
 */
type TableColumnDefinition<ObjectType> = {
  key: string;
  thContent: ReactNode;
  getTdContent: (object: ObjectType) => ReactNode;
  widthRem: number;
};

export type TableColumnDefinitions<ObjectType> = TableColumnDefinition<ObjectType>[]

/**
 * Tableコンポーネントが受け取るpropsの型
 */
type TableProps<ObjectType> = {
  /** 表示するオブジェクトの配列 */
  objects: ObjectType[];
  /** ローディング状態かどうか */
  isLoading?: boolean;
  /** テーブルの全カラム定義 */
  columnDefinitions: TableColumnDefinitions<ObjectType>;
  /**
   * オブジェクトからReactのkeyとして一意な値を取得する関数
   * (例: (user) => user.id)
   */
  toKey: (object: ObjectType) => string | number;
  /** 表示したいカラムのキー配列 (この配列の順序で表示されます) */
  selectedKeys?: string[];
};

// --- 内部利用の型 ---
type ColumnDataUnit<ObjectType> = {
  widthRem: number;
  thContent: ReactNode;
  getTdContent: (object: ObjectType) => ReactNode;
};
type ColumnDataRecord<ObjectType> = Record<string, ColumnDataUnit<ObjectType>>;


// --- 2. Table コンポーネント ---
export function Table<ObjectType>({
  objects,
  isLoading,
  columnDefinitions,
  toKey,
  selectedKeys,
}: TableProps<ObjectType>) {

  // propsで渡された「カラム定義の配列(Array)」を、
  // keyで高速にアクセスできる「Record(Map)形式」に変換します。
  // columnDefinitionsが変わらない限り、この変換は再実行されません。
  const columnData = useMemo(() => {
    const record: ColumnDataRecord<ObjectType> = {};
    for (const col of columnDefinitions) {
      record[col.key] = {
        widthRem: col.widthRem,
        thContent: col.thContent,
        getTdContent: col.getTdContent,
      };
    }
    return record;
  }, [columnDefinitions]);

  // propsで渡された「表示キーの配列(selectedKeys)」に基づいて、
  // 実際に描画するヘッダー(th)とセル(td)のリストを作成します。
  const [thList, tdList, numOfColumns] = useMemo(() => {
    const ths: { key: string; widthRem: number; content: ReactNode }[] = [];
    const tds: { key: string; getContent: (object: ObjectType) => ReactNode }[] = [];

    for (const key of selectedKeys || columnDefinitions.map((def) => def.key)) {
      if (columnData[key]) {
        const { thContent, widthRem, getTdContent } = columnData[key];
        ths.push({ key: key, widthRem, content: thContent });
        tds.push({ key: key, getContent: getTdContent });
      }
    }
    // ths.length を numOfColumns として返します
    return [ths, tds, ths.length];
  }, [columnData, selectedKeys]);

  // ヘッダー(<thead>)部分のJSXをメモ化します
  const Thead = useMemo(() => {
    return (
      <thead>
        <tr>
          {thList.map(({ key, content, widthRem }) => <th key={key} style={{width: `${widthRem}rem`}}>{content}</th>)}
        </tr>
      </thead>
    );
  }, [thList]);

  // 各行(<tr>)を描画するコンポーネントをメモ化します
  const NormalTr: FC<{ object: ObjectType }> = useCallback(({ object }) => {
    return (
      <tr>
        {tdList.map(({ key, getContent }) => {
          // ここのkeyは「カラムのkey」です (例: 'name', 'email')
          return <td key={key}>{getContent(object)}</td>;
        })}
      </tr>
    );
  }, [tdList]); // tdListが変わらない限り、NormalTrコンポーネントは再生成されません

  // 通常時のテーブル本体
  return (
    <table>
      {Thead}
      <tbody>
        {isLoading ? (
            <tr>
              <td colSpan={numOfColumns}>
                <div style={{ marginInline: 'auto', width: 'fit-content' }}>
                  <LoadingSpinner />
                </div>
              </td>
            </tr>
          ) : objects.length == 0 ? (
            <tr>
              <td colSpan={numOfColumns}>
                <div style={{ marginInline: 'auto', width: 'fit-content' }}>
                  No Data
                </div>
              </td>
            </tr>
          ) : objects.map((object) => (
            <NormalTr
              // ここのkeyは「行のkey」です (例: user.id)
              // propsで渡された toKey 関数を使って一意なキーを生成します
              key={toKey(object)}
              object={object}
            />
          ))
        }
      </tbody>
    </table>
  );
}