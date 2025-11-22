import { useCallback } from "react";

import { useControllerContext } from "./contexts";

type SelectPageSizeProps = {
  onChange: (newSize: number) => void;
  currentSize: number;
}

const pageSizeSelections = [ 5, 10, 20, 40 ];

function SelectPageSize({ onChange, currentSize }: SelectPageSizeProps) {
  return (
    <select defaultValue={currentSize} onChange={(e) => {onChange(Number(e.target.value))}}>
      {pageSizeSelections.map((size) => {
        return <option key={size} value={size}>{size}</option>
      })}
    </select>
  );
}

function PaginationButtonBase({ onClick, children, className='' }: {onClick?: (newNum: number) => void, children: number, className?: string;}) {
  return (
    <button
      className={`w-[2em] h-[2em] ${className}`}
      onClick={onClick? () => {onClick(children)} : undefined}
    >
      {children}
    </button>
  )
}

type PaginationButtonProps = {
  key: number;
  currentNum: number;
  diff: number;
  lastPageNum: number;
  setPageNum: (newNum: number) => void
}

function PaginationButton({ currentNum, diff, lastPageNum, setPageNum }: PaginationButtonProps) {
  if (currentNum + diff <= 0) {
    return <></>
  }
  if (currentNum + diff > lastPageNum) {
    return <></>
  }

  if (diff == 0) {
    return <PaginationButtonBase className="rounded-sm border-1 border-white">{currentNum}</PaginationButtonBase>
  }

  return <PaginationButtonBase onClick={setPageNum}>{currentNum + diff}</PaginationButtonBase>
}

type ComponentProps = {
  lastPageNum: number;
}

const diffs = [-2, -1, 0, 1, 2];

export function Component({ lastPageNum }: ComponentProps) {
  const controllerContext = useControllerContext();

  if (controllerContext === undefined) {
    return;
  }

  const { fetcher, state: [pageData, setPageData], submit } = controllerContext;

  const setPageNum = useCallback((newNum: number) => {
    if (fetcher.state === 'submitting') {
      return;
    }
    setPageData(prev => {
      const newValue = { ...prev, pageNum: newNum };
      submit(newValue);
      return newValue
    });
  }, [setPageData, fetcher]);

  const setPageSize = useCallback((newSize: number) => {
    if (fetcher.state === 'submitting') {
      return;
    }
    setPageData(prev => {
      const { pageNum: currentNum, pageSize: currentSize } = prev;
      const newNum = Math.ceil((currentNum - 1) * currentSize + 1 / newSize)
      const newValue = { pageNum: newNum, pageSize: newSize };
      submit(newValue);
      return newValue;
    });
  }, [setPageData, fetcher]);

  return (
    <div className="grid grid-cols-6 gap-2">
      <div>
        <SelectPageSize onChange={setPageSize} currentSize={pageData.pageSize} />
      </div>
      <div className="col-span-4 flex justify-center items-center">
        {diffs.map((diff) => {
          return <PaginationButton key={diff} currentNum={pageData.pageNum} diff={diff} lastPageNum={lastPageNum} setPageNum={setPageNum} />
        })}
      </div>
      <div className="text-right pr-2">
        {lastPageNum === 0 ? 'None' : `${pageData.pageNum} / ${lastPageNum}`}
      </div>
    </div>
  );
}