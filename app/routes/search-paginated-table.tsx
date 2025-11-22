import type { LoaderFunctionArgs } from 'react-router'

type ObjectType = {id: number, text: string};

export async function loader({ request }: LoaderFunctionArgs) {
  await new Promise<void>((resolve) => {setTimeout(resolve, 500);});
  
  const url = new URL(request.url);
  const searchedParams = url.searchParams;
  
  const pageNum = Number(searchedParams.get('pageNum'));
  const pageSize = Number(searchedParams.get('pageSize'));

  console.log(searchedParams)
  const objects: ObjectType[] = [];
  for (let i = (pageNum - 1) * pageSize + 1; i <= pageNum * pageSize; i++) {
    objects.push({
      id: i,
      text: `text${i}`,
    });
  }
  return { objects, pageNum, pageSize, lastPageNum: 1000 / pageSize };
  // throw new Error('');
}