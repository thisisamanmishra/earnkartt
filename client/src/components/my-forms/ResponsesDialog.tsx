import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../hooks/useAxiosPrivate';
import Error from '../../pages/Error';
import LoadingSvg from '@/assets/loading.svg';
import BubbleMenuEditor from '../shared/BubbleMenuEditor';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type FormResponseType = {
  createdAt: string;
  form: string;
  response: {
    elementType: string;
    question: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answer: any;
    _id: string;
  }[];
  updatedAt: string;
  _id: string;
};

interface Props {
  children: React.ReactNode;
  formId: string;
  closeHandler: () => void;
}

export default function ResponsesDialog({
  children,
  formId,
  closeHandler,
}: Props) {
  const axiosPrivate = useAxiosPrivate();

  const { data, isPending, isError } = useQuery<FormResponseType[]>({
    queryKey: ['forms', formId, 'responses'],
    queryFn: () =>
      axiosPrivate('/forms/' + formId + '/responses').then(
        res => res.data.data.responses,
      ),
  });

  const renderAnswer = (answer: any, elementType: unknown) => {
    switch (elementType) {
      case 'multi-line':
        return <pre className="font-sans">{answer}</pre>;
      case 'checklist':
        return answer.length === 0 ? (
          '-'
        ) : (
          <ul className="list-disc px-5">
            {answer.map((item: any, i: string) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      case 'date':
        return format(new Date(answer), 'PPP');
      case 'date-range':
        return answer.to
          ? `${format(new Date(answer.from), 'LLL dd, y')} - ${format(
              new Date(answer.to),
              'LLL dd, y',
            )}`
          : format(new Date(answer.from), 'LLL dd, y');
      case 'rich-text':
        return <BubbleMenuEditor content={answer} readOnly />;
      case 'switch':
      case 'checkbox':
        return answer ? 'Yes' : 'No';
      default:
        return answer;
    }
  };

  // Declare uniqueQuestions inside the component
  const uniqueQuestions = data
    ? data[0]?.response.map(({ question }) => question)
    : [];

  return (
    <Dialog
      onOpenChange={open => {
        if (!open) closeHandler();
      }}
    >
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="gap-0">
        {isPending ? (
          <img
            src={LoadingSvg}
            alt="Loading Spinner"
            className="mx-auto my-8 h-20"
          />
        ) : isError ? (
          <div className="mx-6 mb-10">
            <Error fullScreen={false} />
          </div>
        ) : !Array.isArray(data) || data.length === 0 ? (
          <DialogHeader className="space-y-3">
            <DialogTitle>No Responses</DialogTitle>
            <DialogDescription>
              No responses received till now
            </DialogDescription>
          </DialogHeader>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {uniqueQuestions.map((question, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    {question}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((response, responseIndex) => (
                <tr key={responseIndex}>
                  {uniqueQuestions.map((question, questionIndex) => {
                    const answerObj = response.response.find(
                      ({ question: q }) => q === question,
                    );
                    return (
                      <td
                        key={questionIndex}
                        className="whitespace-nowrap px-6 py-4"
                      >
                        {answerObj
                          ? renderAnswer(
                              answerObj.answer,
                              answerObj.elementType,
                            )
                          : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
