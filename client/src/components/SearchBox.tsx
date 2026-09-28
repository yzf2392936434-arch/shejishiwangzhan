import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface SearchBoxProps {
  variant?: 'desktop' | 'mobile';
  onSearch?: () => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ variant = 'desktop', onSearch }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setValue(searchParams.get('q') || ''); }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = value.trim();
    if (keyword) {
      navigate(`/search?q=${encodeURIComponent(keyword)}`);
      if (onSearch) onSearch();
      if (variant === 'mobile') setMobileOpen(false);
    }
  };
  const handleClear = () => setValue('');

  if (variant === 'mobile') {
    if (!mobileOpen) {
      return (<button type="button" onClick={() => setMobileOpen(true)} className="p-2 text-foreground hover:opacity-70 transition-opacity" aria-label="搜索"><Search size={20} /></button>);
    }
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="搜索作品..." className="w-full h-10 pl-9 pr-8 rounded-full bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" autoFocus />
          {value && (
            <button type="button" onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="清除"><X size={14} /></button>
          )}
        </div>
        <button type="button" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">取消</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-[240px]">
      <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="搜索作品..." className="w-full h-9 pl-4 pr-10 rounded-full bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
    </form>
  );
};

export default SearchBox;
