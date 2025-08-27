'use client';

import { useEffect, useState } from 'react';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  type DragEndEvent,
} from '@/components/ui/shadcn-io/kanban';

type Lead = {
  id: string;
  name: string;
  column: string;
  leadId: string;
  rating: number;
  owner?: string;
  createdOn?: string;
  modifiedOn?: string;
  [key: string]: any;
};

type Column = {
  id: string;
  name: string;
  ratingValue: number;
  color: string;
};

const columns: Column[] = [
  { id: 'cold', name: 'Planned', ratingValue: 100000000, color: '#6B7280' },
  { id: 'warm', name: 'In Progress', ratingValue: 100000001, color: '#F59E0B' },
  { id: 'hot', name: 'Done', ratingValue: 100000002, color: '#10B981' },
];

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      
      const transformedLeads: Lead[] = data.map((lead: any) => ({
        id: lead.ycn_leadid,
        name: lead.ycn_name,
        column: getColumnFromRating(lead.ycn_rating),
        leadId: lead.ycn_leadid,
        rating: lead.ycn_rating,
        owner: lead._ownerid_value,
        createdOn: lead.createdon,
        modifiedOn: lead.modifiedon,
      }));
      
      setLeads(transformedLeads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getColumnFromRating = (rating: number): string => {
    switch (rating) {
      case 100000000:
        return 'cold';
      case 100000001:
        return 'warm';
      case 100000002:
        return 'hot';
      default:
        return 'cold';
    }
  };

  const getRatingFromColumn = (columnId: string): number => {
    const column = columns.find(c => c.id === columnId);
    return column ? column.ratingValue : 100000000;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeItem = leads.find((item) => item.id === active.id);
    const overColumn = columns.find(col => col.id === over.id);
    
    if (!activeItem) return;

    const targetColumnId = overColumn ? overColumn.id : 
      leads.find(item => item.id === over.id)?.column || 
      activeItem.column;

    if (activeItem.column !== targetColumnId) {
      const newRating = getRatingFromColumn(targetColumnId);
      
      try {
        const response = await fetch(`/api/leads/${activeItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rating: newRating }),
        });

        if (!response.ok) {
          throw new Error('Failed to update lead');
        }

        const updatedLeads = leads.map(lead => 
          lead.id === activeItem.id 
            ? { ...lead, column: targetColumnId, rating: newRating }
            : lead
        );
        setLeads(updatedLeads);
      } catch (err) {
        console.error('Error updating lead:', err);
        fetchLeads();
      }
    }
  };

  const handleDataChange = (newData: Lead[]) => {
    setLeads(newData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads Pipeline</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your leads by dragging them between stages
          </p>
        </div>

        <div className="h-[calc(100vh-180px)]">
          <KanbanProvider
            columns={columns}
            data={leads}
            onDataChange={handleDataChange}
            onDragEnd={handleDragEnd}
            className="h-full"
          >
            {(column) => (
              <KanbanBoard 
                key={column.id} 
                id={column.id}
                className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <KanbanHeader className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                        {column.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {leads.filter(l => l.column === column.id).length}
                    </span>
                  </div>
                </KanbanHeader>
                <KanbanCards id={column.id} className="p-2">
                  {(item: Lead) => (
                    <KanbanCard 
                      key={item.id} 
                      {...item}
                      className="bg-white dark:bg-gray-700 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="m-0 font-medium text-sm text-gray-900 dark:text-gray-100">
                            {item.name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {item.createdOn && item.modifiedOn && (
                            <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                              {shortDateFormatter.format(new Date(item.createdOn))} - {dateFormatter.format(new Date(item.modifiedOn))}
                            </p>
                          )}
                        </div>
                      </div>
                    </KanbanCard>
                  )}
                </KanbanCards>
              </KanbanBoard>
            )}
          </KanbanProvider>
        </div>
      </div>
    </div>
  );
}