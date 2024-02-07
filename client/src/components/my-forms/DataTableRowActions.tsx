import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MoreHorizontal,
  EditIcon,
  Trash2Icon,
  LinkIcon,
  FilesIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/AlertDialog';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsesDialog from './ResponsesDialog';

export default function DataTableRowActions({ formId }: { formId: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const formI = formId;
  const queryClient = useQueryClient();
  const axiosPrivate = useAxiosPrivate();
  const { mutate, isPending } = useMutation({
    mutationFn: () => axiosPrivate.delete('/forms/' + formId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['forms'],
      });
      toast.success('Form deleted successfully');
    },
    onError: () => toast.error('Error deleting form'),
  });
  const handleDownload = () => {
    // Perform the GET request for download
    axiosPrivate
      .get(`/forms/exceldownload/${formId}`, { responseType: 'blob' }) // Set responseType to 'blob' to handle binary data
      .then(response => {
        // Create a Blob object from the binary data
        const blob = new Blob([response.data], {
          type: response.headers['content-type'],
        });

        // Create a URL for the Blob and open it in a new tab
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Release the Object URL when no longer needed
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading file', error);
        toast.error('Error downloading file');
      });
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          onClick={e => e.stopPropagation()}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[160px]"
        onClick={e => e.stopPropagation()}
      >
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() =>
            window.open(window.location.origin + '/forms/' + formId, '_blank')
          }
        >
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <span>Open Form Link</span>
        </DropdownMenuItem>
        <ResponsesDialog formId={formId} closeHandler={() => setOpen(false)}>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={e => e.preventDefault()}
          >
            <FilesIcon className="h-4 w-4 text-muted-foreground" />
            <span>Show Responses</span>
          </DropdownMenuItem>
        </ResponsesDialog>
        <ResponsesDialog formId={formId} closeHandler={() => setOpen(false)}>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={handleDownload}
          >
            <FilesIcon className="h-4 w-4 text-muted-foreground" />
            <span>Download</span>
          </DropdownMenuItem>
        </ResponsesDialog>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => navigate(formId + '/edit')}
        >
          <EditIcon className="h-4 w-4 text-muted-foreground" />
          <span>Edit</span>
        </DropdownMenuItem>
        <AlertDialog
          onOpenChange={open => {
            if (!open) setOpen(false);
          }}
        >
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={e => e.preventDefault()}
            >
              <Trash2Icon className="h-4 w-4 text-muted-foreground" />
              <span>Delete</span>
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                data and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:space-x-4">
              <Button
                variant="destructive"
                isLoading={isPending}
                onClick={() => {
                  mutate();
                }}
              >
                Yes, delete form
              </Button>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
