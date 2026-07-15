import type { Product } from '../../types';

type ProductThumbProps = {
  product: Product;
  size?: 'sm' | 'md';
};

export function ProductThumb({ product, size = 'md' }: ProductThumbProps) {
  const className = size === 'sm' ? 'h-12 w-12' : 'h-16 w-16';

  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-[#151D30]`}>
      {product.imageUrl ? (
        <img className="h-full w-full object-cover" src={product.imageUrl} alt="" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">IMG</div>
      )}
    </div>
  );
}
