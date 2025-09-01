'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useToast } from '@/hooks/use-toast';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Home } from 'lucide-react';
import Link from 'next/link';
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/ui/shadcn-io/kanban';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

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
  { id: 'cold', name: 'Cold', ratingValue: 100000000, color: '#3B82F6' },
  { id: 'warm', name: 'Warm', ratingValue: 100000001, color: '#F59E0B' },
  { id: 'hot', name: 'Hot', ratingValue: 100000002, color: '#EF4444' },
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
  const { getAccessToken, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    ycn_name: '',
    ycn_rating: '100000000',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartColumn, setDragStartColumn] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch leads if user is authenticated
    if (isAuthenticated) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching leads...');
      
      // Get access token for the user
      const token = await getAccessToken();
      console.log('Access token obtained:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('Unable to get access token. Please sign in again.');
      }
      
      console.log('Calling /api/leads...');
      const response = await fetch('/api/leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        }
        throw new Error(errorData.error || 'Failed to fetch leads from Dataverse');
      }
      const data = await response.json();
      console.log('Leads fetched:', data);
      
      // Transform Dataverse data to component format
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
      setError(err instanceof Error ? err.message : 'An error occurred fetching from Dataverse');
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

  const handleDragStart = (event: DragStartEvent) => {
    const activeItem = leads.find((item) => item.id === event.active.id);
    if (activeItem) {
      setDragStartColumn(activeItem.column);
      console.log('Drag started:', {
        leadId: activeItem.id,
        leadName: activeItem.name,
        startColumn: activeItem.column
      });
    }
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    
    const originalColumn = dragStartColumn;
    setDragStartColumn(null);

    if (!over || !originalColumn) return;

    const activeItem = leads.find((item) => item.id === active.id);
    const overColumn = columns.find(col => col.id === over.id);
    
    if (!activeItem) return;

    // Determine target column from either a column drop or a card drop
    const targetColumnId = overColumn ? overColumn.id : 
      leads.find(item => item.id === over.id)?.column || 
      originalColumn;

    console.log('Drag end:', {
      activeItemId: activeItem.id,
      activeItemName: activeItem.name,
      fromColumn: originalColumn,  // Use the original column we stored
      toColumn: targetColumnId,
      willUpdate: originalColumn !== targetColumnId
    });

    if (originalColumn !== targetColumnId) {
      const newRating = getRatingFromColumn(targetColumnId);
      const targetColumn = columns.find(c => c.id === targetColumnId);
      
      console.log('Updating lead:', {
        leadId: activeItem.id,
        newRating,
        targetColumn: targetColumn?.name
      });
      
      // Optimistic update - update UI immediately
      const previousLeads = [...leads];
      const updatedLeads = leads.map(lead => 
        lead.id === activeItem.id 
          ? { ...lead, column: targetColumnId, rating: newRating, modifiedOn: new Date().toISOString() }
          : lead
      );
      setLeads(updatedLeads);
      
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Unable to get access token');
        }
        
        console.log('Sending PATCH request to:', `/api/leads/${activeItem.id}`);
        console.log('Payload:', { rating: newRating });
        
        const response = await fetch(`/api/leads/${activeItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ rating: newRating }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error('Failed to update lead');
        }

        const responseData = await response.json();
        console.log('Update successful:', responseData);

        // Success notification
        toast({
          title: "Lead Updated",
          description: `${activeItem.name} moved to ${targetColumn?.name || targetColumnId}`,
        });
        
      } catch (err) {
        console.error('Error updating lead in Dataverse:', err);
        
        // Rollback on error
        setLeads(previousLeads);
        
        // Error notification
        toast({
          title: "Update Failed",
          description: "Failed to update lead status. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      console.log('No column change, skipping update');
    }
  };

  const handleDataChange = (newData: Lead[]) => {
    setLeads(newData);
  };

  const handleSubmit = async () => {
    if (!formData.ycn_name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Unable to get access token');
      }
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ycn_name: formData.ycn_name,
          ycn_rating: parseInt(formData.ycn_rating),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      const newLead = await response.json();
      
      // Add the new lead to the list
      const transformedLead: Lead = {
        id: newLead.ycn_leadid,
        name: newLead.ycn_name,
        column: getColumnFromRating(newLead.ycn_rating),
        leadId: newLead.ycn_leadid,
        rating: newLead.ycn_rating,
        createdOn: newLead.createdon,
        modifiedOn: newLead.modifiedon,
      };
      
      // Update local state with new lead
      setLeads([...leads, transformedLead]);
      
      // Close dialog and reset form
      setDialogOpen(false);
      setFormData({ ycn_name: '', ycn_rating: '100000000' });
      
      // Success notification
      toast({
        title: "Lead Created",
        description: `${formData.ycn_name} has been added successfully`,
      });
      
      // Refresh from Dataverse to ensure consistency
      setTimeout(fetchLeads, 500);
    } catch (err) {
      console.error('Error creating lead in Dataverse:', err);
      toast({
        title: "Creation Failed",
        description: "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 sm:p-6">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Leads Pipeline</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              Manage your leads by dragging them between Cold, Warm, and Hot stages
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Lead
                </Button>
              </DialogTrigger>
            <DialogContent className="w-[calc(100%-20px)] max-w-[425px] mx-auto">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter the details for your new lead.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.ycn_name}
                    onChange={(e) => setFormData({ ...formData, ycn_name: e.target.value })}
                    className="col-span-3"
                    placeholder="Enter lead name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rating" className="text-right">
                    Rating
                  </Label>
                  <Select
                    value={formData.ycn_rating}
                    onValueChange={(value) => setFormData({ ...formData, ycn_rating: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100000000">Cold</SelectItem>
                      <SelectItem value="100000001">Warm</SelectItem>
                      <SelectItem value="100000002">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!formData.ycn_name.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Creating in Dataverse...' : 'Create Lead'}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto pb-4">
          <KanbanProvider
            columns={columns}
            data={[...leads]}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            className="min-w-full md:min-w-0"
          >
            {(column) => (
              <KanbanBoard 
                key={column.id} 
                id={column.id}
                className={`bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all min-h-[200px] ${
                  isDragging ? 'border-2 border-dashed border-blue-400 dark:border-blue-600' : ''
                }`}
              >
                <KanbanHeader className="px-2 sm:px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {column.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">
                      {leads.filter(l => l.column === column.id).length}
                    </span>
                  </div>
                </KanbanHeader>
                <KanbanCards id={column.id} className="p-2">
                  {(item: Lead) => (
                    <KanbanCard 
                      key={item.id} 
                      {...item}
                      className="bg-white dark:bg-gray-700 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600 min-h-[44px]"
                    >
                      <div className="p-2 sm:p-3">
                        <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                          <p className="m-0 font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100">
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
    </AuthGuard>
  );
}