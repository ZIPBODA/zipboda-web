import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductDetail } from "@/entities/product";
import { ProductGallery, ProductInfoPanel } from "@/widgets/shop-detail";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const product = await getProductDetail(params.id);
  if (!product) return { title: "상품 | 집보다" };
  return { title: `${product.name} | 집보다`, description: `${product.brand} · ${product.name}` };
}

// figma 135:3872 가구 상품 상세(ZB-U-SHOP-02, PC)
export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProductDetail(params.id);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-0 md:px-6 md:pt-8">
      {/* 모바일 상단바(←/상품명) — figma 419:8541 */}
      <div className="-mx-4 flex items-center gap-3 border-b border-line-subtle bg-surface px-4 py-3 md:hidden">
        <Link href="/shop" aria-label="뒤로" className="flex size-5 items-center justify-center text-base text-fg-strong">
          ←
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-compact font-bold text-fg-heading">{product.name}</p>
          <p className="truncate text-caption text-fg-disabled">{product.brand}</p>
        </div>
        <span aria-hidden className="size-5" />
      </div>

      <nav aria-label="위치" className="hidden items-center gap-2 text-sm md:flex">
        <Link href="/shop" className="text-fg-disabled hover:text-fg-body">
          쇼핑
        </Link>
        <span className="text-fg-disabled">/</span>
        {product.category && (
          <>
            <span className="text-fg-muted">{product.category}</span>
            <span className="text-fg-disabled">/</span>
          </>
        )}
        <span className="font-medium text-fg-heading">{product.name}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-6 md:mt-8 lg:flex-row lg:gap-12">
        <div className="lg:flex-1">
          <ProductGallery name={product.name} images={product.images} />
        </div>
        <div className="min-w-0 lg:flex-1">
          <ProductInfoPanel product={product} />
        </div>
      </div>
    </main>
  );
}
