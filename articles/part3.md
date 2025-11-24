# `React Router` の `useFetcher` で作る、検索・ページネーション付きデータグリッド

本記事は3部作の完結編、Part 3です。

* [Part 1: フォームバリデーション](https://qiita.com/yoshihisa_tanaka/private/74e095f569e42e03cdf1)
* [Part 2: 汎用テーブルコンポーネント](https://qiita.com/yoshihisa_tanaka/private/e2ff43e1488dcb43cd18)
* Part 3: 検索とページネーションの統合 (本記事)

コード全体は[こちら](https://github.com/funai-yoshihisa-tanaka/react-table-article)

## イントロダクション

Part 2では、Propsを渡すだけで表示できる「汎用的なテーブル」を作成しました。
しかし、実務のアプリケーションでは、全データを一度に表示することは稀です。
通常は以下の機能が必要になります。

1. サーバーサイドでの **ページネーション**
2. 条件による **フィルタリング（検索）**
3. ロード中の状態管理

これを `useState` と `useEffect` で愚直に実装すると、「検索条件が変わったらページを1に戻す」「ページ遷移時は検索条件を維持する」といった状態管理が複雑化し、バグの温床になります。
今回は、 `React Router` の `useFetcher` を活用することで、これらの複雑な状態管理をカプセル化した、再利用可能な `<PaginatedTable>` コンポーネントを作成します。

## ディレクトリ構造

```txt
app/
├── components/
│ ├── Table/
│ │ ├── PaginatedTable/
│ │ │ ├── contexts.ts
│ │ │ ├── controller.tsx
│ │ │ ├── form.tsx
│ │ │ ├── index.tsx
│ │ │ └── root.tsx
│ │ ├── index.tsx
│ │ └── Table.tsx
│ ├── ValidatedForm/
│ │ └── // Part 1と同じ
│ └── ValidationMessages.tsx
└── routes/
  └── paginated-table.tsx
```

## アーキテクチャ: `useFetcher` を「ステートマシン」として使う

今回の実装の肝は、 `React Router` の `useFetcher` です。通常の画面遷移（ `useNavigate` ）とは異なり、 `fetcher` を使うと **URL遷移を伴わずにバックグラウンドでデータを取得** できます。

## データフローの設計

このコンポーネントは、以下の3つの役割を統合します。

1. **CriteriaForm (検索条件)** : Part 1で作ったバリデーション付きフォーム。
2. **Controller (ページネーション)** : ページ送りや件数変更を行うUI。
3. **Table (表示)** : Part 2で作った汎用テーブル。

これらを束ねる `PaginatedTable` が、 `fetcher` を通じてサーバー（ `Loader` ）と通信します。

## 実装の詳細

### 1. 状態の共有 (Contexts)

まず `Props` のバケツリレーを防ぐために、親（ `PaginatedTable` ）と子（ `Form`, `Controller` ）が通信するための `Context` を定義します。

```tsx:context.ts
// ... imports

// 検索フォーム用のコンテキスト
type FormBaseContextType = {
  fetcher: FetcherWithComponents<unknown>;
  ref: Ref<HTMLFormElement|null>;
  afterSubmit: () => void;
} | undefined;
export const FormBaseContext = createContext<FormBaseContextType>(undefined);

// ページネーションコントローラー用のコンテキスト
type ControllerContextType = {
  fetcher: FetcherWithComponents<unknown>;
  state: [PageDataContextType, Dispatch<SetStateAction<PageDataContextType>>]; // pageNum, pageSize
  submit: (newPageData?: {pageNum: number, pageSize: number}) => void;
} | undefined;
export const ControllerContext = createContext<ControllerContextType>(undefined);

// ...
```

### 2. 司令塔となる PaginatedTable

ここが実装の核心です。
特に重要なのが `execSubmit` 関数です。「検索ボタンが押されたとき」と「ページネーションボタンが押されたとき」の挙動の違いをここで吸収します。

```tsx
export function PaginatedTable<ObjectType>({actionPath, columnDefinitions, toKey, selectedKeys, children}: PaginatedTableProps<ObjectType>) {
  // 1. Fetcherの取得
  const fetcher = useFetcher<{ objects: ObjectType[], pageNum: number, pageSize: number, lastPageNum: number }>();
  
  // 2. ページネーション状態 (URLではなく内部Stateで管理する場合のハイブリッド構成)
  const pageDataState = useState<{pageNum: number, pageSize: number}>({pageNum: 1, pageSize: 10});
  
  // 3. フォームの参照 (Uncontrolled Componentとして値を吸い出すため)
  const formRef = useRef<HTMLFormElement|null>(null);
  
  // データがあればそれを使う。なければ初期値。
  const { objects = [], lastPageNum = 0 } = fetcher.data || {};

  // 4. 送信ロジックの統合
  const execSubmit = useCallback((newPageData?: {pageNum: number, pageSize: number}) => {
    if (fetcher.state === 'idle') {
      // 検索フォームの内容をFormDataとして取得
      // (検索フォームが存在しない場合も考慮して空のFormDataを作成)
      const formData = formRef.current ? new FormData(formRef.current) : new FormData();
      
      if ( newPageData ) {
        // A. ページネーション操作時: 指定されたページ番号・サイズで送信
        formData.set('pageNum', newPageData.pageNum.toString());
        formData.set('pageSize', newPageData.pageSize.toString());
      } else {
        // B. 検索ボタン押下時: 強制的に「1ページ目」にリセットする
        pageDataState[1](prev => {
          const resetPageData = { pageNum: 1, pageSize: prev.pageSize };
          formData.set('pageNum', resetPageData.pageNum.toString());
          formData.set('pageSize', resetPageData.pageSize.toString());
          return resetPageData;
        });
      }
      
      // GETリクエストとしてFetcherを実行
      void fetcher.submit(formData, { method: 'get', action: actionPath });
    }
  }, [actionPath, fetcher, formRef, pageDataState]);

  // 初期表示時にデータをロード
  useEffect(() => {
    execSubmit();
  }, []); // 初回のみ実行

  // ... Context Provider と Table の描画 (コード全体参照)
}
```

**ここでのポイント:**

* `formRef` を使うことで、ページネーション操作時（検索ボタンを押していない時）でも、**現在入力されている検索条件** を維持したまま次のページを取得できます。
* `newPageData` 引数の有無によって、ページ遷移（条件維持）か、新規検索（ページリセット）かを判断しています。

### 3. ページネーションコントローラー (`controller.tsx`)

ここでは、ページ番号や表示件数（PageSize）の変更をハンドリングします。
特に「表示件数を変更したとき」のUXにこだわりました。

```tsx
  const setPageSize = useCallback((newSize: number) => {
    if (fetcher.state === 'submitting') return;

    setPageData(prev => {
      const { pageNum: currentNum, pageSize: currentSize } = prev;
      // 表示件数を変えても、ユーザーが見ていたレコード付近を表示し続ける計算ロジック
      const newNum = Math.ceil(((currentNum - 1) * currentSize + 1) / newSize);
      
      const newValue = { pageNum: newNum, pageSize: newSize };
      submit(newValue); // 親のsubmitを叩く
      return newValue;
    });
  }, [setPageData, fetcher]);
```

### 4. 検索フォームとの統合 (`form.tsx`)

Part 1で作成した `FormWithValidation` をラップし、submitイベントを乗っ取ります。

```tsx
export function CriteriaForm({ children }: CriteriaFormProps) {
  const baseContext = useFormBaseContext();
  // ...
  const { afterSubmit, fetcher, ref } = baseContext;

  return (
    // バリデーションが通った後に afterSubmit() が呼ばれ、
    // root.tsx の execSubmit が発火する
    <FormWithValidation ref={ref} fetcher={fetcher} method="get" onSubmit={() => {afterSubmit()}}>
      {children}
    </FormWithValidation>
  );
}
```

---

## 使い方 (利用側のコード)

これらを組み合わせると、利用側のコード（Pageコンポーネント）は驚くほどシンプルになります。
状態管理やAPI呼び出しの複雑さはすべて隠蔽されています。

### `app/routes/paginated-table.tsx`

```tsx
// app/routes/paginated-table.tsx
import { PaginatedTable, CriteriaForm } from "@/components/Table";
import { NoValidationInput, ClearButton } from '@/components/ValidatedForm';

export default function PaginatedTablePage() {
  // カラム定義 (Part 2と同様)
  const columnDefs = [ ... ];

  return (
    <PaginatedTable 
      actionPath='/search-api-endpoint' // データを取得するLoaderのパス
      columnDefinitions={columnDefs} 
      toKey={(obj) => obj.id} 
    >
      {/* 検索フォームエリア: 必要なInputを置くだけ */}
      <CriteriaForm>
        <div className="flex gap-2 items-end">
          <label>
            検索ワード:
            <NoValidationInput name="searchWord" />
          </label>
          <button type="submit">検索</button>
          <ClearButton>クリア</ClearButton>
        </div>
      </CriteriaForm>
    </PaginatedTable>
  );
}
```

### サーバーサイド (Loader) の実装例

React Router の `loader` では、`request.url` からクエリパラメータを解析してデータを返します。

```tsx
// app/routes/search-paginated-table.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const params = url.searchParams;

  // クエリパラメータの取得
  const pageNum = Number(params.get('pageNum') || "1");
  const pageSize = Number(params.get('pageSize') || "10");
  const searchWord = params.get('searchWord') || "";

  // DB等からのデータ取得シミュレーション
  const { objects, totalCount } = await db.find({ ... });

  return { 
    objects, 
    pageNum, 
    pageSize, 
    // 割り切れない場合を考慮して切り上げ
    lastPageNum: Math.ceil(totalCount / pageSize) 
  };
}
```

## まとめ

全3回にわたり、実務で使える「堅牢で再利用可能なテーブルシステム」を構築してきました。

1. **バリデーション** : UIロジックと状態管理を分離し、パフォーマンスを最適化。
2. **汎用テーブル** : 型安全なProps設計で、定型的なテーブル実装を排除。
3. **統合 (今回)** : `useFetcher` を活用し、検索・ページネーション・ローディング制御をカプセル化。

このアーキテクチャの最大の利点は、「コンポーネントを利用する開発者」が、通信状態やバリデーションの複雑さを意識せず、ビジネスロジック（どのデータをどう表示するか）に集中できる点 にあります。

ぜひ、皆さんのプロジェクトに合わせてカスタマイズして使ってみてください。
