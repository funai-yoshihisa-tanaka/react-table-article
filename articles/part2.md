# `React` と `TypeScript` で、 `props` ベースの汎用 `Table` コンポーネントを作った話

本記事は3部作のPart 1です。

* [Part 1](https://qiita.com/yoshihisa_tanaka/private/74e095f569e42e03cdf1)
* Part 2
* [Part 3]()

[コード全体はこちら](https://github.com/funai-yoshihisa-tanaka/react-table-article)（3部作全体です。）

## イントロダクション

`React` プロジェクトでデータを一覧表示する際、`<table>` タグは欠かせません。
しかし、単純なテーブルでも、以下のような共通処理が毎回発生して面倒ではありませんか？

* ヘッダー( `<th>` )とボディ( `<td>` )の定義
* データのロード中( `isLoading` )にスピナーを表示する
* データが0件のときに「No Data」のようなメッセージを表示する
* 各カラムの幅を調整したい

これらの要件をプロジェクトごとに実装するのは非効率です。
そこで今回は、 **必要なpropsを渡すだけで上記すべてをいい感じに処理してくれる** 、型安全で汎用的な `Table` コンポーネントを作成しました。

この記事では、そのコンポーネントの「使い方（API）」と「実装のポイント」を紹介します。

---

## このコンポーネントの使い方 (API)

まず、この `Table` コンポーネントをどのように使うかを見てみましょう。
**すべてpropsで定義を渡す** シンプルな設計になっています。

**▼ `MyPage.tsx` （利用側の例）**

```tsx
import { Table, TableColumnDefinitions } from '@/components/Table'; // 作成したコンポーネント
import { useState } from 'react';

// 1. 表示するデータの型
type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
};

// 2. カラム定義をコンポーネントの外で定義
// (TypeScriptの型推論が効く)
const columnDefs: TableColumnDefinitions<User> = [
  {
    key: 'id',
    thContent: 'ID', // thタグ部分の表示内容
    widthRem: 10,
    getTdContent: (user) => user.id, // user が User 型として推論される
  },
  {
    key: 'name',
    thContent: '名前',
    widthRem: 15,
    getTdContent: (user) => <b>{user.name}</b>, // JSXも返せる
  },
  {
    key: 'email',
    thContent: 'Email',
    widthRem: 20,
    getTdContent: (user) => user.email,
  },
  // 'role' カラムは定義されているが、selectedKeysになければ表示されない
  {
    key: 'role',
    thContent: '権限',
    widthRem: 10,
    getTdContent: (user) => (user.role === 'admin' ? '管理者' : '一般'),
  }
];

// 3. ページコンポーネント
export function MyPage() {
  const [users, setUsers] = useState<User[]>([/* APIから取得したデータ... */]);
  const [isLoading, setIsLoading] = useState(false);

  // 表示したいカラムのキーを配列で管理 (動的な表示/非表示も可能)
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['id', 'name']);

  return (
    <div>
      {/* カラム表示切り替えデモ */}
      <button onClick={() => setSelectedKeys(['id', 'name', 'email', 'role'])}>
        全カラム表示
      </button>
      <button onClick={() => setSelectedKeys(['id', 'name'])}>
        IDと名前のみ
      </button>

      {/* 4. Tableコンポーネントの呼び出し */}
      <Table // Genericsで型を指定
        objects={users}
        isLoading={isLoading}
        columnDefinitions={columnDefs}
        toKey={(user) => user.id} // Reactが要求する `key` を生成
        selectedKeys={selectedKeys} // 表示するカラムを指定
      />
    </div>
  );
}
```

---

## こだわった設計ポイント

このコンポーネントを作る上でこだわった、4つのポイントを紹介します。

### 1. Propsベースの宣言的なAPI

コンポーネントに必要なもの（データ、カラム定義、キー）をすべて `props` で渡すシンプルな設計にしました。

これにより、コンポーネントの利用側( `MyPage.tsx` など)が状態( `selectedKeys` など)を完全に制御でき、 `Table` コンポーネント自体は `props` を受け取って描画するだけの「ダムコンポーネント」として振る舞えます。

### 2. 型安全なカラム定義 (Generics)

コンポーネントの型定義は以下のようになっています。

```tsx
export function Table<ObjectType>({ ... }: TableProps<ObjectType>) { ... }
```

`ObjectType` というGenerics（ジェネリクス）を受け取ることで、`TableProps` の中身も動的に型付けされます。

```tsx
type TableProps<ObjectType> = {
  objects: ObjectType[];
  columnDefinitions: TableColumnDefinitions<ObjectType>;
  toKey: (object: ObjectType) => string | number;
  // ...
};

type TableColumnDefinitions<ObjectType> = TableColumnDefinition<ObjectType>[];

type TableColumnDefinition<ObjectType> = {
  getTdContent: (object: ObjectType) => ReactNode;
  // ...
};
```

これにより、呼び出し側が `<Table>` と型を指定すると、`toKey` や `getTdContent` の引数 `object` が自動的に `User` 型と推論されます。
これにより、`user.id` のようなプロパティアクセスでエディタの補完が効き、タイプミスを防ぐことができます。

### 3. カラム幅の指定（とTailwindの罠）

カラム幅は `widthRem` というpropsで `rem` 単位で指定できるようにしました。

```tsx
<th style={{ width: `${widthRem}rem` }}> ... </th>
```

当初、Tailwind CSSを使っていたので
```tsx
className={`w-[${widthRem}rem]`}
```
のように動的にクラスを生成しようとしました。
しかし、 **Tailwindはビルド時にソースコードをスキャンしてCSSを生成する** ため、実行時に動的に生成されるクラス文字列（例: `w-[10rem]`）はCSSとして出力されず、スタイルが適用されません。

そのため、ここはTailwindの機能に頼らず、素直に `style` 属性に `rem` を指定する方法で解決しました。

### 4. `isLoading` と `No Data` の自動表示

テーブルUIで必須となる状態表示を、コンポーネントが自動でハンドリングするようにしました。

`<tbody>` の内部を、propsの状態に応じて3パターンで描画しています。

1.  `isLoading={true}` の場合 → `LoadingSpinner` を表示
2.  `isLoading={false}` かつ `objects.length === 0` の場合 → "No Data" を表示
3.  上記以外 → `objects.map(...)` でデータを描画

これにより、テーブルの利用側は `isLoading` と `objects` を渡すだけで、面倒な分岐処理を書く必要がなくなります。

---

## コンポーネントの全コード

以下が、今回作成した `Table.tsx` の全コードです。

```tsx
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMemo, useCallback } from "react";
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
  /** 表示したいカラムのキー配列 (指定がなければ定義順に全表示) */
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

  // カラム定義(配列)を、高速アクセスのためRecord(Map)に変換
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

  // 実際に表示するヘッダー(th)とセル(td)のリストを計算
  const [thList, tdList, numOfColumns] = useMemo(() => {
    const ths: { key: string; widthRem: number; content: ReactNode }[] = [];
    const tds: { key: string; getContent: (object: ObjectType) => ReactNode }[] = [];

    // selectedKeysがなければ、定義順に全カラムを表示
    const keysToShow = selectedKeys || columnDefinitions.map(col => col.key);

    for (const key of keysToShow) {
      if (columnData[key]) {
        const { thContent, widthRem, getTdContent } = columnData[key];
        ths.push({ key: key, widthRem, content: thContent });
        tds.push({ key: key, getContent: getTdContent });
      }
    }
    return [ths, tds, ths.length];
  }, [columnData, selectedKeys, columnDefinitions]);

  // ヘッダー(<thead>)部分
  const Thead = useMemo(() => {
    return (
      <thead>
        <tr>
          {thList.map(({ key, content, widthRem }) => (
            <th key={key} style={{ width: `${widthRem}rem` }}>
              {content}
            </th>
          ))}
        </tr>
      </thead>
    );
  }, [thList]);

  // 各行(<tr>)を描画するコンポーネント
  const NormalTr: FC<{ object: ObjectType }> = useCallback(({ object }) => {
    return (
      <tr>
        {tdList.map(({ key, getContent }) => {
          return <td key={key}>{getContent(object)}</td>;
        })}
      </tr>
    );
  }, [tdList]);

  // テーブル本体
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
          ) : objects.length === 0 ? (
            <tr>
              <td colSpan={numOfColumns}>
                <div style={{ marginInline: 'auto', width: 'fit-content' }}>
                  No Data
                </div>
              </td>
            </tr>
          ) : objects.map((object) => (
            <NormalTr
              key={toKey(object)}
              object={object}
            />
          ))
        }
      </tbody>
    </table>
  );
}
```

---

### まとめ

propsベースで型安全な汎用 `Table` コンポーネントを作成しました。
このコンポーネントのおかげで、新しい一覧ページを実装する際の「ローディング」「データ無し」「カラム定義」といったお決まりのコードを考える必要がなくなり、開発効率が向上しました。

もちろん、これだけではまだ完成ではありません。多くのテーブルで要求される「 **ソート機能** 」や「 **ページネーション機能** 」はどうするんだ？ と思われたかもしれません。

ご安心ください。これらの重要な機能は、今回作成した `Table` コンポーネントを内部で利用する形で、次回の **Part2** で実装していく予定です。

皆さんのコンポーネント設計の参考になれば幸いです。Part2もぜひ、ご期待ください！