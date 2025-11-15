import { render, screen, within } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom'; // toHaveStyle などのマッチャーを利用
import { Table, type TableColumnDefinitions } from '@/components/Table'; // コンポーネントをインポート

// --- 1. モックの設定 ---

// LoadingSpinner コンポーネントをモックします
// 実際のスピナーの代わりに 'Loading...' というテキストを表示するようにします
vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div>Loading...</div>,
}));

// --- 2. テストデータの準備 ---

type User = {
  id: string;
  name: string;
  email: string;
};

// テスト用のカラム定義
const testColumnDefs: TableColumnDefinitions<User> = [
  {
    key: 'id',
    thContent: 'ID',
    widthRem: 5,
    getTdContent: (user) => user.id,
  },
  {
    key: 'name',
    thContent: 'Name',
    widthRem: 10,
    getTdContent: (user) => user.name,
  },
  {
    key: 'email',
    thContent: 'Email',
    widthRem: 15,
    getTdContent: (user) => user.email,
  },
];

// テスト用のデータ
const testUsers: User[] = [
  { id: 'u1', name: 'Alice', email: 'alice@example.com' },
  { id: 'u2', name: 'Bob', email: 'bob@example.com' },
];

// テスト用の toKey 関数
const toKey = (user: User) => user.id;

// --- 3. テストスイート ---

describe('Table Component', () => {

  test('1. should render loading spinner when isLoading is true', () => {
    render(
      <Table<User>
        objects={[]}
        isLoading={true}
        columnDefinitions={testColumnDefs}
        toKey={toKey}
      />
    );

    // モックした LoadingSpinner のテキストが表示されていることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // データや "No Data" が表示されていないことを確認
    expect(screen.queryByText('No Data')).not.toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  test('2. should render "No Data" when objects array is empty and not loading', () => {
    render(
      <Table<User>
        objects={[]}
        isLoading={false}
        columnDefinitions={testColumnDefs}
        toKey={toKey}
      />
    );

    // "No Data" が表示されていることを確認
    expect(screen.getByText('No Data')).toBeInTheDocument();
    // ローディングやデータが表示されていないことを確認
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  test('3. should render table headers and rows correctly with data', () => {
    render(
      <Table<User>
        objects={testUsers}
        isLoading={false}
        columnDefinitions={testColumnDefs}
        toKey={toKey}
      />
    );

    // ヘッダーが正しく表示されているか (selectedKeysがないので全て)
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();

    // データの行（tbody > tr）が testUsers の数だけあるか
    const tableBody = screen.getByRole('table').querySelector('tbody');
    const rows = within(tableBody!).getAllByRole('row');
    expect(rows).toHaveLength(testUsers.length); // 2行

    // 1行目のデータが正しいか
    const row1Cells = within(rows[0]).getAllByRole('cell');
    expect(row1Cells[0]).toHaveTextContent('u1');
    expect(row1Cells[1]).toHaveTextContent('Alice');
    expect(row1Cells[2]).toHaveTextContent('alice@example.com');

    // 2行目のデータが正しいか
    const row2Cells = within(rows[1]).getAllByRole('cell');
    expect(row2Cells[0]).toHaveTextContent('u2');
    expect(row2Cells[1]).toHaveTextContent('Bob');
    expect(row2Cells[2]).toHaveTextContent('bob@example.com');
  });

  test('4. should render only selected columns when selectedKeys is provided', () => {
    // 'id' と 'email' のみを選択
    const selectedKeys = ['id', 'email'];
    render(
      <Table<User>
        objects={testUsers}
        isLoading={false}
        columnDefinitions={testColumnDefs}
        toKey={toKey}
        selectedKeys={selectedKeys}
      />
    );

    // 選択したヘッダーのみ表示されていること
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    
    // 選択していないヘッダー('Name')が表示されていないこと
    expect(screen.queryByRole('columnheader', { name: 'Name' })).not.toBeInTheDocument();

    // 1行目のセルが 'id' と 'email' のみになっていること
    const tableBody = screen.getByRole('table').querySelector('tbody');
    const row1 = within(tableBody!).getAllByRole('row')[0];
    const row1Cells = within(row1).getAllByRole('cell');

    expect(row1Cells).toHaveLength(2); // セルは2つ
    expect(row1Cells[0]).toHaveTextContent('u1'); // 1番目のセルは 'id'
    expect(row1Cells[1]).toHaveTextContent('alice@example.com'); // 2番目のセルは 'email'
  });

  
  test('5. should ignore wrong columns when selectedKeys is provided', () => {
    // 'id' と 'email' のみを選択
    const selectedKeys = ['dummy'];
    const { container } = render(
      <Table<User>
        objects={[]}
        isLoading={false}
        columnDefinitions={testColumnDefs}
        toKey={toKey}
        selectedKeys={selectedKeys}
      />
    );

    // 選択したヘッダーのみ表示されていること
    expect(container.getElementsByTagName('thead')[0]?.children.length).toBe(1);
    expect(container.getElementsByTagName('thead')[0]?.children.item(0)?.children.length).toBe(0);
  });

  test('6. should render all columns in order when selectedKeys is not provided', () => {
    render(
      <Table<User>
        objects={testUsers}
        isLoading={false}
        columnDefinitions={testColumnDefs}
        toKey={toKey}
        selectedKeys={undefined} // 明示的に undefined (propsが渡されない状態)
      />
    );

    // ヘッダーが定義順にすべて表示されていること
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('ID');
    expect(headers[1]).toHaveTextContent('Name');
    expect(headers[2]).toHaveTextContent('Email');
  });

  test('6. should apply correct width style to headers', () => {
    render(
      <Table<User>
        objects={testUsers}
        isLoading={false}
        columnDefinitions={testColumnDefs}
        toKey={toKey}
      />
    );

    // 'Name' カラムのヘッダーは widthRem: 10 だった
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameHeader).toHaveStyle({ width: '10rem' });

    // 'Email' カラムのヘッダーは widthRem: 15 だった
    const emailHeader = screen.getByRole('columnheader', { name: 'Email' });
    expect(emailHeader).toHaveStyle({ width: '15rem' });
  });

});