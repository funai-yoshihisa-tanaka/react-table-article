import { useCallback } from "react";

import { usePageDataStateContext } from "./contexts";

type SelectPageSizeProps = {
  onChange: (newSize: number) => void;
  currentSize: number;
}

const pageSizeSelections = [ 5, 10, 20, 40 ];

function SelectPageSize({ onChange, currentSize }: SelectPageSizeProps) {
  return (
    <select onChange={(e) => {onChange(Number(e.target.value))}}>
      {pageSizeSelections.map((size) => {
        return <option key={size} value={size} selected={size === currentSize}>{size}</option>
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
  isTop: boolean;
  isLoading: boolean;
  lastPageNum: number;
}

const diffs = [-2, -1, 0, 1, 2];

export function Component({ isTop, isLoading, lastPageNum }: ComponentProps) {
  const [pageData, setPageData] = usePageDataStateContext();

  const setPageNum = useCallback((newNum: number) => {
    setPageData(prev => isLoading ? prev : {...prev, pageNum: newNum});
  }, [setPageData, isLoading]);

  const setPageSize = useCallback((newSize: number) => {
    setPageData(prev => {
      if ( isLoading ) {
        return prev;
      }
      const { pageNum: currentNum, pageSize: currentSize } = prev;
      const currentIndexes = {
        from: (currentNum - 1) * currentSize + 1,
        to: currentNum * currentSize,
      };
      const newNum = isTop? Math.ceil(currentIndexes.from / newSize) : Math.ceil((currentIndexes.to - 1) / newSize);
      return { pageNum: newNum, pageSize: newSize };
    });
  }, [setPageData, isTop, isLoading]);

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