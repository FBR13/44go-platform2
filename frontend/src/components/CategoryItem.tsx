interface CategoryItemProps {
  name: string;
  icon: string;
}

export function CategoryItem({ name, icon }: CategoryItemProps) {
  return (
    <button className="group flex flex-col items-center gap-3 min-w-[100px] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 snap-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-orange-50 text-2xl group-hover:bg-gradient-to-r group-hover:from-[#fa7109] group-hover:to-[#ab0029] transition-colors">
        <span className="group-hover:scale-110 transition-transform duration-300">{icon}</span>
      </div>
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{name}</span>
    </button>
  );
}