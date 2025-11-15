import { useEffect, useState } from 'react';
import { useFetcher, type ActionFunctionArgs } from 'react-router';
import { FormWithValidation, EmailInput, PhoneNumberInput } from '@/components/ValidatedForm'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  console.log(Object.fromEntries(formData));
  return {};
}

export default function App() {
  const fetcher = useFetcher();
  const [email, setEmail] = useState('');
  useEffect(() => {
    console.log(fetcher.data);
  }, [fetcher.data]);
  return (
    <>
      <h1>React Router 連携フォーム</h1>

      {/* 例1: Fetcher を使った非同期送信 */}
      {/* ページ遷移せず、バリデーション通過後に fetcher.submit が実行される */}
      <FormWithValidation fetcher={fetcher} method="post" actionPath="/form">
        <EmailInput name="email" required />
        <button>非同期で送信</button>
        {fetcher.state === 'submitting' && <p>送信中...</p>}
      </FormWithValidation>

      <hr />

      {/* 例2: React Router の action への送信 */}
      {/* バリデーション通過後に useSubmit が実行され、/form の action へ遷移（または処理） */}
      <FormWithValidation method="post"> {/* actionPath を省略すると現在のルートの action を使う */}
        <EmailInput name="email" controlledState={[email, setEmail]} />
        <EmailInput name="email-confirm" syncWith={email} />
        <PhoneNumberInput name="phone" required />
        <button>通常の action へ送信</button>
      </FormWithValidation>
    </>
  )
}