'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/lib/documents';
import { SearchQuery, SearchChunkResult } from '@/types/document';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Tag as TagIcon,
  ChevronRight,
  Database,
  BrainCircuit,
  Merge
} from 'lucide-react';
import { formatFileSize, getFileTypeConfig } from '@/types/document';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState<'hybrid' | 'semantic' | 'keyword'>('hybrid');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');

  const searchQuery: SearchQuery = {
    query,
    type: searchType,
    filters: {},
    page: 1,
    limit: 20
  };

  if (courseFilter) {
    searchQuery.filters!.course = courseFilter;
  }
  if (tagFilter) {
    searchQuery.filters!.tags = [tagFilter];
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query, searchType, courseFilter, tagFilter],
    queryFn: () => documentsApi.search(searchQuery),
    enabled: query.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Search Knowledge Base</h1>
          <p className="text-muted-foreground">
            Instantly find answers across all your uploaded documents using AI semantic search.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="space-y-4 bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Search Filters
            </h3>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Search Engine</label>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setSearchType('hybrid')}
                  className={`flex items-center gap-2 text-sm p-2 rounded-md transition-colors ${searchType === 'hybrid' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  <Merge className="w-4 h-4" /> Hybrid (Best)
                </button>
                <button 
                  onClick={() => setSearchType('semantic')}
                  className={`flex items-center gap-2 text-sm p-2 rounded-md transition-colors ${searchType === 'semantic' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  <BrainCircuit className="w-4 h-4" /> Semantic (Concepts)
                </button>
                <button 
                  onClick={() => setSearchType('keyword')}
                  className={`flex items-center gap-2 text-sm p-2 rounded-md transition-colors ${searchType === 'keyword' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  <Database className="w-4 h-4" /> Keyword (Exact)
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                Course
              </label>
              <input
                type="text"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                placeholder="e.g. CS101"
                className="w-full h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <label className="text-sm font-medium flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-muted-foreground" />
                Tag
              </label>
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="e.g. midterm"
                className="w-full h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ask a question or search for keywords..."
              className="w-full h-14 pl-12 pr-24 rounded-xl border bg-card text-base shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
              <button
                type="submit"
                disabled={!searchInput.trim()}
                className="h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 transition-opacity hover:bg-primary/90"
              >
                Search
              </button>
            </div>
          </form>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              Searching through documents...
            </div>
          ) : error ? (
            <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-xl">
              An error occurred while searching. Please try again.
            </div>
          ) : !query ? (
            <div className="py-24 text-center border rounded-xl border-dashed bg-muted/30">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-medium">Ready to search</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Type a question or keyword above to instantly scan all your documents.
              </p>
            </div>
          ) : data?.data && data.data.length === 0 ? (
            <div className="py-24 text-center border rounded-xl border-dashed">
              <p className="text-muted-foreground text-lg">No results found for "{query}"</p>
              <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground mb-4">
                Found {data?.data.length || 0} results for "{query}"
              </p>
              
              <div className="grid gap-4">
                {data?.data.map((result: SearchChunkResult) => (
                  <div key={result.id} className="group p-5 border rounded-xl bg-card hover:shadow-md transition-all hover:border-primary/30">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-md">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground line-clamp-1">
                            {result.payload.documentName || 'Unknown Document'}
                          </h4>
                          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              Chunk #{result.payload.chunkIndex}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Score Badge */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Score: {result.score.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-muted/30 rounded-lg p-4 border border-muted">
                      <p className="text-sm text-foreground leading-relaxed">
                        {result.payload.text}
                      </p>
                    </div>

                    {/* Metadata Badges */}
                    {result.payload.metadata && (Object.keys(result.payload.metadata).length > 0 || (result.payload.metadata as any).course) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(result.payload.metadata as any).course && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border">
                            <BookOpen className="w-3 h-3" />
                            {(result.payload.metadata as any).course}
                          </span>
                        )}
                        {(result.payload.metadata as any).tags?.map((tag: string) => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border">
                            <TagIcon className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
