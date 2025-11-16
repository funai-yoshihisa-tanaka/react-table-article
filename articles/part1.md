# `React Router` と連携する、再利用可能なフォームバリデーションシステム

本記事は3部作のPart 1です。

* Part 1
* [Part 2](https://qiita.com/yoshihisa_tanaka/private/e2ff43e1488dcb43cd18)
* [Part 3]()

[コード全体はこちら](https://github.com/funai-yoshihisa-tanaka/react-table-article)（3部作全体です。）

React Router でフォームを扱う際、クライアントサイドの高度なバリデーションと、action関数へのデータ送信をどう両立させるかは悩みの種です。
ネイティブな `<form>` 送信ではバリデーションが難しく、かといって `onSubmit` ですべて制御すると `React Router` のデータフローの恩恵を受けにくくなります。
この記事では、以前作成した[こちら](https://qiita.com/yoshihisa_tanaka/private/de4772a4227690f9f3ed)の `React Context` と `useRef` を活用した宣言的なバリデーションシステムに、 `React Router` の `useSubmit` フックと `Fetcher` を統合する方法を紹介します。
これにより、クライアントサイドでの高パフォーマンスなバリデーションと、 `React Router` の強力なデータ管理フローを両立させます。

（バリデーションロジックには `Zod` を採用していますが、これは他のライブラリでも代替可能です）

## アーキテクチャとディレクトリ構造

このシステムの核心は、責務の明確な分離にあります。
```
├── components/
│ ├── ValidatedForm/
│ │ ├── Input/
│ │ │ ├── EmailInput.tsx
│ │ │ ├── InputBase.tsx
│ │ │ ├── PhoneNumberInput.tsx
│ │ │ └── index.tsx
│ │ ├── ClearButton.tsx
│ │ ├── Form.tsx
│ │ └── index.tsx
│ └── ValidationMessages.tsx
└── App.tsx
```
各ファイルの役割は明確に分離されています。

### 1. Form.tsx (フォームコンテキストと送信制御):
フォーム全体の「状態」と「更新関数」を管理する司令塔です。
`Context` を通じて、子コンポーネントに「送信が押されたか」( `FormStateContext` )、バリデーション結果や各種関数を登録するための「更新関数群」( `FormDispatchContext` )、「リセット関数」( `FormClearContext` ) を提供します。 
そして最も重要な役割として、 `onSubmit` を制御し、バリデーション通過後に `useSubmit` または `fetcher` を使って `React Router` の `action` にデータを送信します。

### 2. InputBase.tsx (共通入力ロジック):
すべての入力コンポーネントの基盤です。 `onBlur` や「送信」シグナルでバリデーションを実行し、 `FormDispatchContext` 経由で結果を親に報告します。

### 3. ClearButton.tsx (リセットトリガー):
`FormClearContext` から「リセット関数」を受け取り、 `onClick` で実行するだけのシンプルなコンポーネントです。

### 4. `EmailInput.tsx` / `PhoneNumberInput.tsx` (具象コンポーネント):
`InputBase` をラップし、特定の入力タイプに必要なスキーマ（ `zod` ）や、 `beforeValidate` （バリデーション前の値整形）関数を渡す「薄い」コンポーネントです。

## 主要コンポーネントの詳細

### 1. src/components/ValidatedForm/Form.tsx - フォームの「司令塔」
`Form` コンポーネントは、バリデーションの状態収集、リセット機能の提供、そして `React Router` へのデータ送信という3つの主要な責務を持ちます。

```typescript:Form.tsx
import React from 'react'
import { useSubmit, type FetcherWithComponents, type HTMLFormMethod } from 'react-router'

// Context や型定義 (DidPassData, ClearFuncsRecord など) は前記事と同様なので省略

// Props定義
type Props<ResponseDataType> = {
  children?: React.ReactNode;
  fetcher?: FetcherWithComponents<ResponseDataType>;
  method?: HTMLFormMethod;
  actionPath?: string;
}

// fetcherの有無により form / fetcher.Form を切り替えるため
type FormProps<ResponseDataType> = Props<ResponseDataType> & {
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}
function Form<ResponseDataType = unknown>({ children, fetcher, onSubmit, method, actionPath }: FormProps<ResponseDataType>): React.ReactElement<FormProps<ResponseDataType>> {
  if ( fetcher ) {
    return (
      <fetcher.Form method={method} action={actionPath} onSubmit={onSubmit}>
        {children}
      </fetcher.Form>
    )
  }
  return (
    <form method={method} action={actionPath} onSubmit={onSubmit}>
      {children}
    </form>
  )
}
type FormWithValidationProps<ResponseDataType> = Props<ResponseDataType> & {
  onSubmit?: (event: React.FormEvent<HTMLFormElement>, formDataRecord: Record<string, string>) => void;
}

// メインのコンポーネント
export function FormWithValidation<ResponseDataType = unknown>({ children, fetcher, onSubmit, method, actionPath }: FormWithValidationProps<ResponseDataType>): React.ReactElement<FormWithValidationProps<ResponseDataType>> {
  // 1. React Router の useSubmit フックを取得
  const submit = useSubmit();

  const [didTapSubmit, setDidTapSubmit] = React.useState(false);
  const [currentEvent, setCurrentEvent] = React.useState<React.FormEvent<HTMLFormElement>|undefined>(undefined);
  const [didPassData, setDidPassData] = React.useState<DidPassData>({});
  const clearFuncsRecordRef = React.useRef<ClearFuncsRecord>({});

  // dispatchContext, clear, didPass の定義 (前記事と同様なので省略)
  // ...

  // 2. 【核心】バリデーション通過後の「実際の送信」ロジック
  const runSubmitLogic = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    // FormData をプレーンなオブジェクトに変換
    const formDataRecord: Record<string, string> = {}
    for (const [key, value] of new FormData(event?.target as HTMLFormElement)) {
      if (typeof value == 'string') {
        formDataRecord[key] = value
      }
    }
    
    const submitOptions = {
      method: method || 'post',
      action: actionPath
    };

    if (onSubmit) {
      // 独自の onSubmit があればそれを実行 (React Router を使わない場合)
      onSubmit(event, formDataRecord);
    } else if (fetcher) {
      // 3. fetcher が渡されていれば、fetcher.submit を使う
      fetcher.submit(formDataRecord, submitOptions);
    } else {
      // 4. それ以外の場合は、useSubmit() で React Router の action に送信
      submit(formDataRecord, submitOptions);
    }
  }, [onSubmit, fetcher, method, actionPath, submit]);

  // 5. フォームの onSubmit イベントを乗っ取るための localOnSubmit と useEffectの設定 (前記事と同様なので省略)
  // ...

  // 6. 描画するフォームを <form> または <fetcher.Form> に切り替える
  return (
    <Form onSubmit={localOnSubmit} fetcher={fetcher} method={method} actionPath={actionPath}>
      // (前記事と同様なので省略)
      // ...
    </Form>
  )
}
```

このコンポーネントの設計は、前記事 で解説されているパフォーマンス（ `Context` 分離、 `useRef` ）への配慮に加え、 `React Router` との連携が鍵となります。

#### 1. `onSubmit` の乗っ取り:
`localOnSubmit` で `event.preventDefault()` を呼び出し、ブラウザによるネイティブなフォーム送信を 常に 停止させます。これにより、クライアントサイドでのバリデーションロジックを確実に実行する時間を確保します。

#### 2. 遅延送信:
ユーザーが送信ボタンを押した時点（ `localOnSubmit` ）でバリデーション（ `didPass` ）が通っていない場合、送信イベント（ `event` ）を `currentEvent` に一時保存します。

#### 3. useEffect による監視:
`InputBase` コンポーネント群での入力とバリデーションが進み、全フィールドのバリデーションが通過すると `didPass` が `true` になります。 `useEffect` がこれを検知し、保存されていた `currentEvent` を使って `runSubmitLogic` を実行します。

#### 4. React Router への送信:
`runSubmitLogic` が、このシステムの核心です。 `fetcher` が `props` として渡されていれば `fetcher.submit()` を、そうでなければ `useSubmit()` を呼び出します。
どちらも、 `React Router` が管理する `action` 関数に対して、プログラム的にデータを送信するための公式な方法です。

### 2. src/components/ValidatedForm/Input/InputBase.tsx - 高機能な「実行役」

`InputBase` の設計は、前記事 で解説されているものと同一です。 `Form` コンポーネント（親）が `React Router` との通信をすべて担当するため、 `InputBase` 自身は `React Router` を意識する必要がありません。

1. `useFormDispatch` と `useFormState` を通じて親と通信します。

2. マウント時に `useEffect` を使い、自身のバリデーション状態（ `setDidPass` ）とリセット関数（ `setClearFunctions` ）を親に「登録」します。

3. アンマウント時にクリーンアップ関数で、親から自身の状態と関数を「登録解除」します。

4. `onFocus` で `cancelPendingSubmit()` を呼び出し、「バリデーションエラー修正後に意図せず即時送信される」バグを防ぎます。

5. src/components/ValidatedForm/ClearButton.tsx - 安全なリセットトリガー
このコンポーネントも 前記事の解説と同一です。 `useFormClear` で取得した `clear` 関数を `onClick` で実行します。

最も重要なのは、 `type="button"` を明示的に指定している点です。もし `type="reset"` を使用すると、 `React` の `State` 更新と `HTML` ネイティブの `reset` 動作が競合し、 `React` の `State` と DOM の値が不整合を起こすバグの原因となります。 `type="button"` にすることで、状態管理を 100% `React` の制御下に置くことができます。

## 実際の使用例 (src/App.tsx)
`React Router` 環境で、この `FormWithValidation` を使用する例です。ルート遷移を伴う通常の `action` 送信と、 `Fetcher` を使った非同期送信の両方に対応できます。

```typescript:App.tsx
import { useState } from 'react';
import { useFetcher } from 'react-router-dom'; // useFetcher をインポート
import { FormWithValidation, EmailInput, PhoneNumberInput, ClearButton } from './components/ValidatedForm'

export default function App() {
  const [email, setEmail] = useState('');
  
  // React Router の Fetcher を使う例
  const fetcher = useFetcher();

  return (
    <>
      <h1>フォームの例</h1>
      
      {/* 例1: ルート遷移を伴う通常のフォーム送信 (action へ) */}
      <FormWithValidation actionPath="/signup">
        <h2>サインアップ (ページ遷移あり)</h2>
        <div>
          <EmailInput name="email-signup" required />
        </div>
        <div>
          <PhoneNumberInput name="phone-signup" />
        </div>
        <div>
          <ClearButton>リセット</ClearButton>
          <button type="submit">サインアップ</button>
        </div>
      </FormWithValidation>

      <hr style={{ margin: '2rem 0' }} />

      {/* 例2: Fetcher を使った非同期フォーム送信 (action へ) */}
      <FormWithValidation fetcher={fetcher} actionPath="/update-profile">
        <h2>プロフィール更新 (ページ遷移なし)</h2>
        <div>
          {/* 制御コンポーネントとして */}
          <EmailInput name="email" controlledState={[email, setEmail]} required />
        </div>
        <div>
          {/* 別の state と値を同期させるバリデーション */}
          <EmailInput name="email-confirm" syncWith={email} required />
        </div>
        <div>
          {/* 非制御コンポーネントとして (name属性が重要) */}
          <PhoneNumberInput name="phone" />
        </div>
        {/* ボタンエリア */}
        <div>
          <ClearButton>リセット</ClearButton>
          <button type="submit">プロフィール更新</button>
        </div>
        {fetcher.state !== 'idle' && <p>更新中...</p>}
        {fetcher.data && <p>更新完了: {JSON.stringify(fetcher.data)}</p>}
      </FormWithValidation>
    </>
  );
}
```

### 非制御コンポーネントの値収集

`InputBase` は、 `controlledState` が渡されればその `state` を参照する「制御コンポーネント」として動作し、渡されなければ内部の `useState` を参照する「非制御コンポーネント」として動作します。

では、 `PhoneNumberInput` のように `controlledState` を渡さない非制御コンポーネントの値は、いつどのように収集するのでしょうか。

答えは `Form.tsx` の `runSubmitLogic` 関数にあります。
この関数は、`new FormData(event?.target as HTMLFormElement)` を使ってDOMから値を収集し、それをプレーンなオブジェクト `formDataRecord` に変換します。

この `formDataRecord` が `submit(formDataRecord, ...)` または `fetcher.submit(formDataRecord, ...)` へ渡されます。
`React Router` の `submit` 関数は `FormData` だけでなくオブジェクトも扱えるため、 `name="phone"` が指定されていれば値を正しく `action` に送信できます。

`controlledState` が必要なのは、今回の `email` と `email-confirm` のように、 `syncWith` を使ってコンポーネント間で値をリアルタイムに比較する（ `email` の値を `email-confirm` が知る）必要がある場合などに限定されます。

## まとめ

この記事では、 `React Context` と `useRef` を用いた高パフォーマンスなバリデーションシステムを、`React Router` のデータフローと統合するアプローチを紹介しました。

* **責務の分離:** `Form` が「仲介役・司令塔」、 `InputBase` が「実行役・登録役」として明確に分離されています。
* **`React Router` との連携:** `onSubmit` を `preventDefault()` で乗っ取り、バリデーション通過後に `useSubmit` または `fetcher.submit` でプログラム的に `action` へデータを送信します。
* **堅牢なバグ修正:** `onFocus` による「保留中送信のキャンセル」や、 `type="button"` による「リセット動作の競合回避」など、 `React` 特有の落とし穴をふさぐ堅牢な設計になっています。
