interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", name: "全部" },
  { id: "noodles", name: "麵食類" },
  { id: "rice", name: "飯類" },
  { id: "appetizers", name: "開胃菜" },
  { id: "drinks", name: "飲料" },
];

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <section className="max-w-md mx-auto px-4 mb-4">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </section>
  );
}
