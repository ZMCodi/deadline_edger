'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  X, 
  Calendar, 
  User, 
  Tag, 
  FileText,
  Clock,
  Star,
  Mail
} from 'lucide-react'

interface EmailSearchProps {
  onSearch: (query: string) => void
  onClear: () => void
  initialQuery?: string
}

interface SearchFilter {
  type: 'from' | 'to' | 'subject' | 'has' | 'label' | 'is' | 'date'
  value: string
  label: string
}

const QUICK_FILTERS = [
  { type: 'is' as const, value: 'unread', label: 'Unread', icon: Mail },
  { type: 'is' as const, value: 'starred', label: 'Starred', icon: Star },
  { type: 'has' as const, value: 'attachment', label: 'Has Attachment', icon: FileText },
  { type: 'is' as const, value: 'important', label: 'Important', icon: Tag },
]

const DATE_FILTERS = [
  { value: 'newer_than:1d', label: 'Last 24 hours' },
  { value: 'newer_than:7d', label: 'Last week' },
  { value: 'newer_than:1m', label: 'Last month' },
  { value: 'older_than:1m', label: 'Older than 1 month' },
  { value: 'older_than:1y', label: 'Older than 1 year' },
]

export function EmailSearch({ onSearch, onClear, initialQuery = '' }: EmailSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilter[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newFilterType, setNewFilterType] = useState<string>('')
  const [newFilterValue, setNewFilterValue] = useState('')

  useEffect(() => {
    if (initialQuery) {
      parseQuery(initialQuery)
    }
  }, [initialQuery])

  const parseQuery = (query: string) => {
    const newFilters: SearchFilter[] = []
    let remainingQuery = query

    const filterPatterns = [
      { regex: /from:(\S+)/gi, type: 'from' as const },
      { regex: /to:(\S+)/gi, type: 'to' as const },
      { regex: /subject:(\S+)/gi, type: 'subject' as const },
      { regex: /has:(\S+)/gi, type: 'has' as const },
      { regex: /label:(\S+)/gi, type: 'label' as const },
      { regex: /is:(\S+)/gi, type: 'is' as const },
      { regex: /(newer_than:\S+|older_than:\S+)/gi, type: 'date' as const },
    ]

    filterPatterns.forEach(({ regex, type }) => {
      let match
      while ((match = regex.exec(query)) !== null) {
        const value = match[1] || match[0]
        newFilters.push({
          type,
          value,
          label: `${type}: ${value}`
        })
        remainingQuery = remainingQuery.replace(match[0], '').trim()
      }
    })

    setFilters(newFilters)
    setSearchQuery(remainingQuery)
  }

  const buildQuery = (baseQuery: string, currentFilters: SearchFilter[]) => {
    const filterParts = currentFilters.map(filter => {
      if (filter.type === 'date') {
        return filter.value
      }
      return `${filter.type}:${filter.value}`
    })
    
    return [baseQuery, ...filterParts].filter(Boolean).join(' ').trim()
  }

  const handleSearch = () => {
    const fullQuery = buildQuery(searchQuery, filters)
    onSearch(fullQuery)
  }

  const handleClear = () => {
    setSearchQuery('')
    setFilters([])
    onClear()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const addFilter = (type: string, value: string, label?: string) => {
    if (!value.trim()) return

    const newFilter: SearchFilter = {
      type: type as SearchFilter['type'],
      value: value.trim(),
      label: label || `${type}: ${value.trim()}`
    }

    setFilters(prev => [...prev, newFilter])
    setNewFilterType('')
    setNewFilterValue('')
  }

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

  const addQuickFilter = (filter: typeof QUICK_FILTERS[0]) => {
    const exists = filters.some(f => f.type === filter.type && f.value === filter.value)
    if (!exists) {
      addFilter(filter.type, filter.value, filter.label)
    }
  }

  const addDateFilter = (dateFilter: string) => {
    const exists = filters.some(f => f.type === 'date' && f.value === dateFilter)
    if (!exists) {
      const label = DATE_FILTERS.find(df => df.value === dateFilter)?.label || dateFilter
      addFilter('date', dateFilter, label)
    }
  }

  const handleAdvancedFilter = () => {
    if (newFilterType && newFilterValue) {
      addFilter(newFilterType, newFilterValue)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        {(searchQuery || filters.length > 0) && (
          <Button variant="outline" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter.label}
              <button
                onClick={() => removeFilter(index)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-2">Quick Filters:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((filter) => {
              const Icon = filter.icon
              const isActive = filters.some(f => f.type === filter.type && f.value === filter.value)
              return (
                <Button
                  key={`${filter.type}-${filter.value}`}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => addQuickFilter(filter)}
                  disabled={isActive}
                  className="flex items-center gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {filter.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Date Filters:</p>
          <div className="flex flex-wrap gap-2">
            {DATE_FILTERS.map((dateFilter) => {
              const isActive = filters.some(f => f.type === 'date' && f.value === dateFilter.value)
              return (
                <Button
                  key={dateFilter.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => addDateFilter(dateFilter.value)}
                  disabled={isActive}
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  {dateFilter.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1"
          >
            Advanced Filters
            <X className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-45' : 'rotate-0'}`} />
          </Button>

          {showAdvanced && (
            <Card className="mt-2">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select value={newFilterType} onValueChange={setNewFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="from">From</SelectItem>
                      <SelectItem value="to">To</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="has">Has</SelectItem>
                      <SelectItem value="label">Label</SelectItem>
                      <SelectItem value="is">Is</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="Filter value"
                    value={newFilterValue}
                    onChange={(e) => setNewFilterValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdvancedFilter()}
                  />
                  
                  <Button 
                    onClick={handleAdvancedFilter}
                    disabled={!newFilterType || !newFilterValue}
                    size="sm"
                  >
                    Add Filter
                  </Button>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Examples:</strong></p>
                  <p>• from:example@gmail.com</p>
                  <p>• subject:meeting</p>
                  <p>• has:attachment</p>
                  <p>• is:unread</p>
                  <p>• label:important</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}