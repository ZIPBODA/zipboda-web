import { ProductCard, type Product } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { HomeSection } from "./HomeSection";

// figma 135:7368 인기 가구 추천
export function HomeFurniture({ items }: { items: Product[] }) {
  return (
    <HomeSection title="인기 가구 추천" description="새 집을 위한 엄선된 가구" actionLabel="전체 쇼핑" last>
      <div className="grid grid-cols-4 gap-5">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} action={<AddToCartButton item={{ id: item.id, brand: item.brand, name: item.name, price: item.price }} />} />
        ))}
      </div>
    </HomeSection>
  );
}
