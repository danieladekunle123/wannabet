import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchBar({ placeholder = "Search matches, players, tournaments...", onSearch, className = "" }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="pr-11 bg-muted/50 border-border focus:border-primary w-full"
      />
      <Button
        size="icon"
        variant="default"
        onClick={handleSearch}
        className="absolute right-0.5 h-8 w-8 bg-primary hover:bg-primary/70 hover:scale-105 text-primary-foreground shadow-sm transition-all duration-200"
        type="button"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}