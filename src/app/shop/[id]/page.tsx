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
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-8">
      <nav aria-label="위치" className="flex items-center gap-2 text-sm">
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

      <div className="mt-8 flex flex-col gap-12 lg:flex-row">
        <div className="lg:flex-1">
          <ProductGallery name={product.name} image={product.image} />
        </div>
        <div className="min-w-0 lg:flex-1">
          <ProductInfoPanel product={product} />
        </div>
      </div>
    </main>
  );
}
