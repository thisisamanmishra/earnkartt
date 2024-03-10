import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KeyboardSensor, PointerSensor } from '../lib/dndKitSensors';
import FormElements from '../components/create-form/FormElements';
import {
  FormElementButton,
  FormElementButtonProps,
} from '../components/create-form/DraggableButton';
import { useEffect, useState } from 'react';
import FormPlayground from '../components/create-form/FormPlayground';
import Input from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EyeIcon, HammerIcon, LockIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/AlertDialog';
import { useFormPlaygroundStore } from '../stores/formPlaygroundStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import toast from 'react-hot-toast';
import DemoInfoCard from '../components/create-form/DemoInfoCard';
import type { FormType } from '../types';
import { Switch } from '../components/ui/Switch';
import FormPreview from '../components/create-form/FormPreview';

interface Props {
  formType?: 'add' | 'edit';
  form?: FormType;
}

export default function CreateForm({ formType = 'add', form }: Props) {
  const { pathname } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isDemo = pathname === '/demo';
  const queryClient = useQueryClient();

  const [isPreview, setIsPreview] = useState(false);

  const [formName, setFormName] = useState(form?.name ?? '');
  const [partnerLink, setPartnerLink] = useState(form?.partnerLink ?? '');
  const [activeButton, setActiveButton] =
    useState<FormElementButtonProps | null>(null);
  const [isDropped, setIsDropped] = useState(false);
  const handleAddUniqueCode = () => {
    const textarea = document.getElementById(
      'partnerLinkTextarea',
    ) as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart || 0;
      const endPos = textarea.selectionEnd || 0;
      const value = textarea.value;
      const newValue =
        value.substring(0, startPos) + '{uniquecode}' + value.substring(endPos);
      setPartnerLink(newValue);

      // Calculate the new cursor position after adding the unique code
      const newCursorPos = startPos + '{uniquecode}'.length;
  
      // Restore cursor position after adding the unique code
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }
  };
  

  const addFormElement = useFormPlaygroundStore(state => state.addFormElement);
  const removeAllFormElements = useFormPlaygroundStore(
    state => state.removeAllFormElements,
  );
  const formElements = useFormPlaygroundStore(state => state.formElements);

  useEffect(() => {
    return () => {
      if (formType === 'edit') removeAllFormElements();
    };
  }, [removeAllFormElements, formType]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const axiosPrivate = useAxiosPrivate();
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      axiosPrivate({
        url: formType === 'add' ? '/forms' : '/forms/' + id,
        method: formType === 'add' ? 'post' : 'patch',
        data: {
          name: formName,
          partnerLink: partnerLink,
          elements: formElements,
        },
      }),
    onSuccess: () => {
      if (formType === 'edit') navigate('/my-forms');
      queryClient.invalidateQueries({
        queryKey: ['forms'],
      });
      setFormName('');
      removeAllFormElements();
      toast.success(
        `Form ${formType === 'add' ? 'created' : 'updated'} successfully`,
      );
    },
    onError: () =>
      toast.error(`Error ${formType === 'add' ? 'creating' : 'updating'} form`),
  });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={e => {
        setActiveButton(e.active.data.current?.element);
        setIsDropped(false);
      }}
      onDragCancel={() => {
        setActiveButton(null);
        setIsDropped(false);
      }}
      onDragEnd={({ over, active }) => {
        setActiveButton(null);
        if (!over) return;
        addFormElement(
          active.data.current?.element.text as string,
          active.id as string,
        );
        setIsDropped(true);
      }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:gap-12">
        <FormElements isUpdate={formType === 'edit'} />
        <form
          className="flex flex-grow flex-col"
          onSubmit={e => {
            e.preventDefault();
            if (formElements.length === 0) {
              toast.error('Form is empty!');
              return;
            }
            mutate();
          }}
        >
          <section className="mb-3">
            <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
              <label className="font-medium">Form Name:</label>
              <Input
                required
                placeholder="Enter form name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>
            <div className="mt-3 flex flex-col items-center gap-3 md:mt-0 md:flex-row md:gap-4">
              <label className="font-medium">Partner Link:</label>
              <textarea
                id="partnerLinkTextarea"
                required
                placeholder="Enter Partner Link"
                value={partnerLink}
                onChange={e => setPartnerLink(e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              className="hover:bg-primary-dark ml-2 rounded-md bg-primary px-2 py-1 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={handleAddUniqueCode}
            >
              Add Unique Code
            </button>
          </section>
          <section className="mt-3 md:mt-5">
            <div className="flex items-center gap-4 text-sm font-medium">
              <div
                className={`flex items-center gap-2 transition-colors ${
                  isPreview ? '' : 'text-primary'
                }`}
              >
                <HammerIcon className="h-5 w-5" />
                <span>Builder</span>
              </div>
              <Switch
                className="data-[state=unchecked]:bg-primary"
                checked={isPreview}
                onCheckedChange={setIsPreview}
              />
              <div
                className={`flex items-center gap-2 transition-colors ${
                  isPreview ? 'text-primary' : ''
                }`}
              >
                <EyeIcon className="h-5 w-5" />
                <span>Preview</span>
              </div>
            </div>
            {isPreview ? (
              <FormPreview />
            ) : (
              <FormPlayground
                isDropped={isDropped}
                resetIsDropped={() => setIsDropped(false)}
                isUpdate={formType === 'edit'}
              />
            )}
          </section>
          <section className="mt-5 flex items-center gap-5 md:self-end">
            {isDemo && <DemoInfoCard />}
            {form && (
              <Button onClick={() => navigate('/my-forms')} variant="outline">
                Cancel
              </Button>
            )}
            {formElements.length !== 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Clear Form
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Form?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear the form? This action is
                      irreversible and will permanently remove all the progress
                      in the current form.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="sm:space-x-4">
                    <AlertDialogAction onClick={removeAllFormElements}>
                      Yes, clear form
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              disabled={isDemo}
              isLoading={isPending}
              className={isDemo ? 'gap-2.5' : ''}
            >
              {isDemo && <LockIcon className="h-[18px] w-[18px]" />}
              <span>{form ? 'Update Form' : 'Create Form'}</span>
            </Button>
          </section>
        </form>
      </div>
      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {activeButton ? (
          <FormElementButton className="cursor-grabbing" {...activeButton} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
