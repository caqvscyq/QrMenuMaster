interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", name: "全部" },
  { id: "1", name: "麵食類" },
  { id: "2", name: "飯類" },
  { id: "3", name: "開胃菜" },
  { id: "4", name: "飲料" },
];

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 mb-4">
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${
              selectedCategory === category.id
                ? "bg-primary text-white shadow-md"
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
